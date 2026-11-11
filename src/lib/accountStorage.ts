const ACCOUNT_STORAGE_PREFIX = "bcoming:account";

/** Keep browser-only onboarding and community state isolated per auth user. */
export const accountStorageKey = (userId: string, key: string) =>
  `${ACCOUNT_STORAGE_PREFIX}:${userId}:${key}`;

export const readAccountStorage = (userId: string, key: string) => {
  try {
    return localStorage.getItem(accountStorageKey(userId, key));
  } catch {
    return null;
  }
};

export const writeAccountStorage = (userId: string, key: string, value: string) => {
  try {
    localStorage.setItem(accountStorageKey(userId, key), value);
  } catch {
    // Browser storage can be unavailable in private or restricted contexts.
  }
};

export const removeAccountStorage = (userId: string, key: string) => {
  try {
    localStorage.removeItem(accountStorageKey(userId, key));
  } catch {
    // Browser storage can be unavailable in private or restricted contexts.
  }
};
