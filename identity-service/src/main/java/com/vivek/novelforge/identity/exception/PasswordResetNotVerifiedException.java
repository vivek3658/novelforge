package com.vivek.novelforge.identity.exception;

public class PasswordResetNotVerifiedException extends RuntimeException {
    public PasswordResetNotVerifiedException(String message) {
        super(message);
    }
}
