export const globalResponse = (err, req, res, next) => {
    if (err) {
        res.status(err['cause'] || 500).json({
            msg: err.message,
            statusCode: err['cause'] || 500,
            // err_loc: err.stack
        })
        next()
    }
}