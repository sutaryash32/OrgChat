package com.orgchat.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {

    @Id
    private String id;

    @Indexed(unique = true)
    private String merID;          // Member Entity Reference ID

    @Indexed(unique = true)
    private String email;

    private String passwordHash;

    private String displayName;    // first.last frontend handle

    private String avatarUrl;

    @Builder.Default
    private String role = "USER";  // USER, ADMIN

    private String ssoProvider;    // "google", "azure", etc.

    private Instant createdAt;

    private Instant updatedAt;
}
