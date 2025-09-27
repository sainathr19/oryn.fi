const REQUIRED_ENV_VARS = {
    ASSETS_URL: import.meta.env.VITE_ASSETS_URL,
    PROJECT_ID: import.meta.env.VITE_PROJECT_ID,
} as const;

export const API = () => {
    Object.entries(REQUIRED_ENV_VARS).forEach(([key, value]) => {
        if (!value) throw new Error(`Missing ${key} in env`);
    });

    return {
        assets: `${REQUIRED_ENV_VARS.ASSETS_URL}/assets`,
        projectId: REQUIRED_ENV_VARS.PROJECT_ID,
    };
};