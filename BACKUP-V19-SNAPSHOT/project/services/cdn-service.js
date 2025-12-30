// Sistema de CDN Global - Gol de Ouro v1.2.0
// ==========================================
const AWS = require('aws-sdk');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

class CDNService {
  constructor() {
    // Configuração AWS S3 para CDN
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    });

    this.bucketName = process.env.AWS_S3_BUCKET || 'goldeouro-cdn';
    this.cloudFrontDomain = process.env.CLOUDFRONT_DOMAIN || 'd1234567890.cloudfront.net';
    
    // Configuração Cloudflare (alternativa)
    this.cloudflareApiKey = process.env.CLOUDFLARE_API_KEY;
    this.cloudflareZoneId = process.env.CLOUDFLARE_ZONE_ID;
    this.cloudflareEmail = process.env.CLOUDFLARE_EMAIL;
  }

  // Upload de arquivo para CDN
  async uploadFile(filePath, options = {}) {
    try {
      const {
        folder = 'assets',
        fileName = null,
        contentType = null,
        makePublic = true,
        optimize = true,
        generateThumbnails = false
      } = options;

      // Ler arquivo
      const fileBuffer = await fs.readFile(filePath);
      const originalFileName = fileName || path.basename(filePath);
      const fileExtension = path.extname(originalFileName).toLowerCase();

      // Otimizar arquivo se necessário
      let optimizedBuffer = fileBuffer;
      let finalContentType = contentType;

      if (optimize) {
        const optimizationResult = await this.optimizeFile(fileBuffer, fileExtension);
        optimizedBuffer = optimizationResult.buffer;
        finalContentType = optimizationResult.contentType;
      }

      // Gerar nome único para o arquivo
      const uniqueFileName = this.generateUniqueFileName(originalFileName);
      const s3Key = `${folder}/${uniqueFileName}`;

      // Upload para S3
      const uploadParams = {
        Bucket: this.bucketName,
        Key: s3Key,
        Body: optimizedBuffer,
        ContentType: finalContentType || this.getContentType(fileExtension),
        ACL: makePublic ? 'public-read' : 'private',
        CacheControl: 'max-age=31536000', // 1 ano
        Metadata: {
          'original-name': originalFileName,
          'upload-date': new Date().toISOString(),
          'optimized': optimize.toString()
        }
      };

      const uploadResult = await this.s3.upload(uploadParams).promise();
      
      // Gerar URLs
      const cdnUrl = this.getCDNUrl(s3Key);
      const s3Url = uploadResult.Location;

      console.log(`✅ [CDN] Arquivo enviado: ${originalFileName} -> ${cdnUrl}`);

      // Gerar thumbnails se solicitado
      let thumbnails = [];
      if (generateThumbnails && this.isImageFile(fileExtension)) {
        thumbnails = await this.generateThumbnails(fileBuffer, s3Key, folder);
      }

      return {
        success: true,
        data: {
          originalName: originalFileName,
          s3Key: s3Key,
          s3Url: s3Url,
          cdnUrl: cdnUrl,
          contentType: finalContentType,
          size: optimizedBuffer.length,
          thumbnails: thumbnails
        }
      };

    } catch (error) {
      console.error('❌ [CDN] Erro ao fazer upload:', error);
      return { success: false, error: error.message };
    }
  }

  // Otimizar arquivo
  async optimizeFile(fileBuffer, fileExtension) {
    try {
      switch (fileExtension) {
        case '.jpg':
        case '.jpeg':
          const jpegBuffer = await sharp(fileBuffer)
            .jpeg({ quality: 85, progressive: true })
            .toBuffer();
          return { buffer: jpegBuffer, contentType: 'image/jpeg' };

        case '.png':
          const pngBuffer = await sharp(fileBuffer)
            .png({ quality: 85, progressive: true })
            .toBuffer();
          return { buffer: pngBuffer, contentType: 'image/png' };

        case '.webp':
          const webpBuffer = await sharp(fileBuffer)
            .webp({ quality: 85 })
            .toBuffer();
          return { buffer: webpBuffer, contentType: 'image/webp' };

        case '.svg':
          // SVG não precisa de otimização de imagem
          return { buffer: fileBuffer, contentType: 'image/svg+xml' };

        case '.css':
          // Minificar CSS (implementar com css-minify)
          return { buffer: fileBuffer, contentType: 'text/css' };

        case '.js':
          // Minificar JS (implementar com terser)
          return { buffer: fileBuffer, contentType: 'application/javascript' };

        default:
          return { buffer: fileBuffer, contentType: null };
      }

    } catch (error) {
      console.error('❌ [CDN] Erro ao otimizar arquivo:', error);
      return { buffer: fileBuffer, contentType: null };
    }
  }

  // Gerar thumbnails
  async generateThumbnails(fileBuffer, originalS3Key, folder) {
    try {
      const sizes = [
        { name: 'thumb', width: 150, height: 150 },
        { name: 'small', width: 300, height: 300 },
        { name: 'medium', width: 600, height: 600 },
        { name: 'large', width: 1200, height: 1200 }
      ];

      const thumbnails = [];

      for (const size of sizes) {
        try {
          const thumbnailBuffer = await sharp(fileBuffer)
            .resize(size.width, size.height, { 
              fit: 'inside',
              withoutEnlargement: true 
            })
            .jpeg({ quality: 80 })
            .toBuffer();

          const thumbnailKey = originalS3Key.replace(/\.[^/.]+$/, `_${size.name}.jpg`);
          
          await this.s3.upload({
            Bucket: this.bucketName,
            Key: thumbnailKey,
            Body: thumbnailBuffer,
            ContentType: 'image/jpeg',
            ACL: 'public-read',
            CacheControl: 'max-age=31536000'
          }).promise();

          thumbnails.push({
            size: size.name,
            url: this.getCDNUrl(thumbnailKey),
            width: size.width,
            height: size.height
          });

        } catch (error) {
          console.error(`❌ [CDN] Erro ao gerar thumbnail ${size.name}:`, error);
        }
      }

      return thumbnails;

    } catch (error) {
      console.error('❌ [CDN] Erro ao gerar thumbnails:', error);
      return [];
    }
  }

  // Gerar nome único para arquivo
  generateUniqueFileName(originalName) {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, extension);
    
    return `${nameWithoutExt}_${timestamp}_${randomString}${extension}`;
  }

  // Obter URL do CDN
  getCDNUrl(s3Key) {
    return `https://${this.cloudFrontDomain}/${s3Key}`;
  }

  // Obter tipo de conteúdo
  getContentType(fileExtension) {
    const contentTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.pdf': 'application/pdf',
      '.mp4': 'video/mp4',
      '.mp3': 'audio/mpeg',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.eot': 'application/vnd.ms-fontobject'
    };

    return contentTypes[fileExtension] || 'application/octet-stream';
  }

  // Verificar se é arquivo de imagem
  isImageFile(fileExtension) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    return imageExtensions.includes(fileExtension);
  }

  // Deletar arquivo do CDN
  async deleteFile(s3Key) {
    try {
      await this.s3.deleteObject({
        Bucket: this.bucketName,
        Key: s3Key
      }).promise();

      console.log(`✅ [CDN] Arquivo deletado: ${s3Key}`);
      return { success: true };

    } catch (error) {
      console.error('❌ [CDN] Erro ao deletar arquivo:', error);
      return { success: false, error: error.message };
    }
  }

  // Listar arquivos do CDN
  async listFiles(folder = '', limit = 100) {
    try {
      const params = {
        Bucket: this.bucketName,
        Prefix: folder,
        MaxKeys: limit
      };

      const result = await this.s3.listObjectsV2(params).promise();
      
      const files = result.Contents.map(file => ({
        key: file.Key,
        url: this.getCDNUrl(file.Key),
        size: file.Size,
        lastModified: file.LastModified,
        etag: file.ETag
      }));

      return {
        success: true,
        data: files,
        count: files.length,
        hasMore: result.IsTruncated
      };

    } catch (error) {
      console.error('❌ [CDN] Erro ao listar arquivos:', error);
      return { success: false, error: error.message };
    }
  }

  // Invalidar cache do CloudFront
  async invalidateCache(paths) {
    try {
      const cloudfront = new AWS.CloudFront();
      
      const invalidationParams = {
        DistributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
        InvalidationBatch: {
          CallerReference: `invalidation-${Date.now()}`,
          Paths: {
            Quantity: paths.length,
            Items: paths
          }
        }
      };

      const result = await cloudfront.createInvalidation(invalidationParams).promise();
      
      console.log(`✅ [CDN] Cache invalidado: ${paths.join(', ')}`);
      return {
        success: true,
        invalidationId: result.Invalidation.Id
      };

    } catch (error) {
      console.error('❌ [CDN] Erro ao invalidar cache:', error);
      return { success: false, error: error.message };
    }
  }

  // Upload de múltiplos arquivos
  async uploadMultipleFiles(files, options = {}) {
    try {
      const results = [];
      
      for (const file of files) {
        const result = await this.uploadFile(file.path, {
          ...options,
          fileName: file.originalname
        });
        results.push(result);
      }

      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      return {
        success: failed.length === 0,
        data: {
          successful: successful.length,
          failed: failed.length,
          results: results
        }
      };

    } catch (error) {
      console.error('❌ [CDN] Erro ao fazer upload múltiplo:', error);
      return { success: false, error: error.message };
    }
  }

  // Obter estatísticas do CDN
  async getCDNStats() {
    try {
      const stats = {
        bucket: this.bucketName,
        cloudfrontDomain: this.cloudFrontDomain,
        totalFiles: 0,
        totalSize: 0,
        lastUpdated: new Date().toISOString()
      };

      // Listar todos os arquivos para calcular estatísticas
      const result = await this.s3.listObjectsV2({
        Bucket: this.bucketName
      }).promise();

      stats.totalFiles = result.Contents.length;
      stats.totalSize = result.Contents.reduce((sum, file) => sum + file.Size, 0);

      return {
        success: true,
        data: stats
      };

    } catch (error) {
      console.error('❌ [CDN] Erro ao obter estatísticas:', error);
      return { success: false, error: error.message };
    }
  }

  // Middleware para servir arquivos do CDN
  cdnMiddleware() {
    return (req, res, next) => {
      // Adicionar headers de CDN
      res.set({
        'X-CDN-Provider': 'AWS CloudFront',
        'X-CDN-Domain': this.cloudFrontDomain,
        'Cache-Control': 'public, max-age=31536000',
        'Expires': new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString()
      });

      next();
    };
  }

  // Gerar URL assinada para arquivos privados
  async generateSignedUrl(s3Key, expiresIn = 3600) {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: s3Key,
        Expires: expiresIn
      };

      const signedUrl = await this.s3.getSignedUrl('getObject', params);
      
      return {
        success: true,
        data: {
          signedUrl: signedUrl,
          expiresIn: expiresIn,
          expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString()
        }
      };

    } catch (error) {
      console.error('❌ [CDN] Erro ao gerar URL assinada:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = CDNService;
