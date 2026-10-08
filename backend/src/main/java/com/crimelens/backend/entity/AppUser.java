package com.crimelens.backend.entity;
import jakarta.persistence.*;
import lombok.*;
@Entity @Table(name = "app_users") @Data @NoArgsConstructor @AllArgsConstructor
public class AppUser {
    @Id @Column(length = 100) private String username;
    @Column(name = "password_hash", nullable = false, length = 100) private String passwordHash;
    @Column(nullable = false, length = 20) private String role;
}
