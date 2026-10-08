package com.crimelens.backend.repository;
import com.crimelens.backend.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
public interface AppUserRepository extends JpaRepository<AppUser, String> {}
