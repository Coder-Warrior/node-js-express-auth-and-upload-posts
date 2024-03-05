const jwt = require("jsonwebtoken");
function check(req, res, next) {
    const cookie = req.cookies.jwt;
    if (cookie) {
        jwt.verify(cookie, "951555951555",  (err, d) => {
            if (d) {
                next();
            } else if (err) {
                res.redirect("/login");
            }
        })
    } else {
        res.redirect("/login");
    }
}

module.exports = { check };
