const express = require("express");

const { signUpController } = require("../controllers/signUp.controller");
const { loginController } = require("../controllers/login.controller");
const { shareLocationController } = require("../controllers/location.controller");
const { requireDriverAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/signup", signUpController);
router.post("/login", loginController);
router.post("/location", requireDriverAuth, shareLocationController);

module.exports = { router };
