package com.textileERP.textileSys.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class JwtTokenService {
    private static final long TOKEN_LIFETIME_SECONDS = 8 * 60 * 60;
    private static final Base64.Encoder ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder DECODER = Base64.getUrlDecoder();
    private static final String HEADER = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";
    private static final Pattern SUBJECT_CLAIM = Pattern.compile("\\\"sub\\\"\\s*:\\s*\\\"([^\\\"]+)\\\"");
    private static final Pattern EXPIRY_CLAIM = Pattern.compile("\\\"exp\\\"\\s*:\\s*(\\d+)");

    private final byte[] secret;

    public JwtTokenService(@Value("${app.jwt.secret}") String secret) {
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
        if (this.secret.length < 32) {
            throw new IllegalArgumentException("app.jwt.secret must contain at least 32 bytes");
        }
    }

    public String createToken(String subject) {
        try {
            String header = encode(HEADER.getBytes(StandardCharsets.UTF_8));
            long now = Instant.now().getEpochSecond();
            String claims = "{\"sub\":\"" + escapeJson(subject) + "\",\"iat\":" + now
                    + ",\"exp\":" + (now + TOKEN_LIFETIME_SECONDS) + "}";
            String payload = encode(claims.getBytes(StandardCharsets.UTF_8));
            String content = header + "." + payload;
            return content + "." + ENCODER.encodeToString(sign(content));
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to create access token", exception);
        }
    }

    public boolean isValid(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) return false;

            String header = new String(DECODER.decode(parts[0]), StandardCharsets.UTF_8);
            if (!HEADER.equals(header)) return false;

            byte[] suppliedSignature = DECODER.decode(parts[2]);
            byte[] expectedSignature = sign(parts[0] + "." + parts[1]);
            if (!MessageDigest.isEqual(suppliedSignature, expectedSignature)) return false;

            String claims = new String(DECODER.decode(parts[1]), StandardCharsets.UTF_8);
            Matcher subject = SUBJECT_CLAIM.matcher(claims);
            Matcher expiry = EXPIRY_CLAIM.matcher(claims);
            return subject.find() && expiry.find()
                    && Long.parseLong(expiry.group(1)) > Instant.now().getEpochSecond();
        } catch (Exception exception) {
            return false;
        }
    }

    private byte[] sign(String value) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret, "HmacSHA256"));
        return mac.doFinal(value.getBytes(StandardCharsets.US_ASCII));
    }

    private String encode(byte[] value) {
        return ENCODER.encodeToString(value);
    }

    private String escapeJson(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
