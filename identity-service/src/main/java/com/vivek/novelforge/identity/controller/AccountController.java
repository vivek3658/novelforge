
package com.vivek.novelforge.identity.controller;

import com.vivek.novelforge.identity.service.AccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/account")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @DeleteMapping
    public ResponseEntity<Map<String, String>> requestAccountDeletion(
            Authentication authentication
    ) {
        accountService.requestAccountDeletion(authentication);

        return ResponseEntity.ok(Map.of(
                "message",
                "Account deletion requested. Your account will be permanently deleted after 30 days unless you cancel."
        ));
    }

    @PostMapping("/cancel-deletion")
    public ResponseEntity<Map<String, String>> cancelAccountDeletion(
            Authentication authentication
    ) {
        accountService.cancelAccountDeletion(authentication);

        return ResponseEntity.ok(Map.of(
                "message",
                "Account deletion cancelled successfully."
        ));
    }
}
