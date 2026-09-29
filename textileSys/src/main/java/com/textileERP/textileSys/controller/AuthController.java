package com.textileERP.textileSys.controller;

import com.textileERP.textileSys.security.JwtTokenService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    private final JwtTokenService jwtTokenService;
    private final String loginEmail;
    private final String loginPassword;

    public AuthController(
            JwtTokenService jwtTokenService,
            @Value("${app.auth.email}") String loginEmail,
            @Value("${app.auth.password}") String loginPassword
    ) {
        this.jwtTokenService = jwtTokenService;
        this.loginEmail = loginEmail;
        this.loginPassword = loginPassword;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (request.email() == null || request.password() == null
                || !loginEmail.equalsIgnoreCase(request.email().trim())
                || !loginPassword.equals(request.password())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Email or password is incorrect"));
        }

        return ResponseEntity.ok(Map.of(
                "accessToken", jwtTokenService.createToken(loginEmail),
                "tokenType", "Bearer",
                "expiresIn", 28800
        ));
    }

    public record LoginRequest(String email, String password) { }
}
