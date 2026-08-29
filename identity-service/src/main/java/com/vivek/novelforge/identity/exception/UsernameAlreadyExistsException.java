package com.vivek.novelforge.identity.exception;


public class UsernameAlreadyExistsException extends RuntimeException{
    private String msg;
    public UsernameAlreadyExistsException(String msg){
        super(msg);
    }
}
