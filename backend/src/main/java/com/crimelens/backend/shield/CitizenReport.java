package com.crimelens.backend.shield;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;
import java.util.UUID;
@Entity @Table(name="citizen_reports") @Getter @Setter
public class CitizenReport {
 @Id @GeneratedValue(strategy=GenerationType.UUID) private UUID id;
 @Column(nullable=false,length=2048) private String url;
 @Column(nullable=false,length=200) private String title;
 @Column(nullable=false,columnDefinition="TEXT") private String description;
 @Column(nullable=false,length=50) private String category;
 @Column(length=100) private String state;
 @Column(name="contact_email",length=254) private String contactEmail;
 @Column(name="submitted_by",nullable=false,length=100) private String submittedBy;
 @Column(name="created_at",nullable=false) private Instant createdAt;
 @PrePersist void created(){createdAt=Instant.now();}
}
