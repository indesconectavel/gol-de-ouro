'use strict';

const {
  createPixDepositCompat,
  isPixDepositConfigured,
  getPixDepositHealth
} = require('../../finance/compat/createPixDepositCompat');
const { claimApprovedPixDeposit } = require('../../finance/deposit/claimApprovedPixDeposit');
const { createPixDeposit } = require('../../finance/deposit/createPixDeposit');

module.exports = {
  createPixDepositCompat,
  isPixDepositConfigured,
  getPixDepositHealth,
  createPixDeposit,
  claimApprovedPixDeposit
};
