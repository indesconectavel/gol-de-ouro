'use strict';



/**

 * PE.2J — tipos / normalizers leves para payout boundary.

 */



function normalizePayoutProcessInput(raw = {}) {

  const base = raw && typeof raw === 'object' ? { ...raw } : {};

  return {

    ...base,

    metadata: base.metadata && typeof base.metadata === 'object' ? base.metadata : {}

  };

}



function normalizePayoutProcessResult(raw = {}) {

  if (!raw || typeof raw !== 'object') {

    return { success: false, processed: false, error: { code: 'EMPTY_RESULT' }, raw: null };

  }

  return {

    success: !!raw.success,

    processed:

      raw.processed != null

        ? !!raw.processed

        : raw.processed === false

          ? false

          : !!raw.success,

    processedCount:

      typeof raw.processedCount === 'number'

        ? raw.processedCount

        : typeof raw.count === 'number'

          ? raw.count

          : undefined,

    error: raw.error || null,

    raw

  };

}



module.exports = {

  normalizePayoutProcessInput,

  normalizePayoutProcessResult

};

