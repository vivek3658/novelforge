package com.vivek.novelforge.identity.service;

public class OtpRateLimitExceededException extends RuntimeException {
    public OtpRateLimitExceededException() {
        super("Too many OTP requests. Please wait before requesting another code.");
    }
}
