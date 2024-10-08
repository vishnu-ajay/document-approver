// Define URLs for different environments
const config = {
    development: {
        backendUrl: 'http://10.132.179.208:3000'
    },
    production: {
        backendUrl: 'https://document-approver-backend.onrender.com'
    }
};

// Export the appropriate configuration based on the environment
export default config[process.env.NODE_ENV] || config.development;