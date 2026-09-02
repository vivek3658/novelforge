package com.vivek.novelforge.novel.controlller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
//@RequestMapping("/test")
public class TestController {
    @GetMapping("/public")
    public ResponseEntity<String> testPublicAPI(){
        return ResponseEntity.ok("Public API");
    }
    @PreAuthorize("hasAuthority('NOVEL_READ')")
    @GetMapping
    public ResponseEntity<String> testAuthorizeAPI(){
        return ResponseEntity.ok("Authorize API");
    }
}
