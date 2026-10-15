const MAX_FAILED_ATTEMPTS = 3;
const failedAttempts = new Map();

function getFailedAttempts(email) {
    return failedAttempts.get(email) || 0;
}

function isBlocked(email) {
    return getFailedAttempts(email) >= MAX_FAILED_ATTEMPTS;
}

function recordFailedAttempt(email) {
    const attempts = getFailedAttempts(email) + 1;
    failedAttempts.set(email, attempts);
    return attempts;
}

function resetFailedAttempts(email) {
    failedAttempts.delete(email);
}

module.exports = {
    MAX_FAILED_ATTEMPTS,
    getFailedAttempts,
    isBlocked,
    recordFailedAttempt,
    resetFailedAttempts
};