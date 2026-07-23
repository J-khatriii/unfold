const healthCheck = (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is healthy",
        timeStamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development"
    });
}

export default healthCheck;
