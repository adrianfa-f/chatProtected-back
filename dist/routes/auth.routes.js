"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const user_schema_1 = require("../schemas/user.schema");
const validate_middleware_1 = require("../middleware/validate.middleware");
const router = (0, express_1.Router)();
router.post('/register', (0, validate_middleware_1.validate)(user_schema_1.registerSchema), auth_controller_1.register);
router.post('/login', (0, validate_middleware_1.validate)(user_schema_1.loginSchema), auth_controller_1.login);
router.post('/logout', auth_controller_1.logout); // Nueva ruta para logout
exports.default = router;
