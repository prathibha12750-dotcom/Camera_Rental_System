
const getBankDetails = () => {
  const bankName = process.env.BANK_NAME?.trim();
  const accountName = process.env.BANK_ACCOUNT_NAME?.trim();
  const accountNumber = process.env.BANK_ACCOUNT_NUMBER?.trim();
  const branch = process.env.BANK_BRANCH?.trim();

  if (
    !bankName ||
    !accountName ||
    !accountNumber ||
    !branch
  ) {
    return null;
  }

  return {
    bankName,
    accountName,
    accountNumber,
    branch,
  };
};

module.exports = {
  getBankDetails,
};
