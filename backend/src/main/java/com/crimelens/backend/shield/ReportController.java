package com.crimelens.backend.shield;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import lombok.RequiredArgsConstructor;
import java.security.Principal;
import java.util.Map;
@RestController @RequiredArgsConstructor
public class ReportController {
 private final CitizenReportRepository reports;private final ShieldRateLimiter rate;
 public record Input(@NotBlank @Size(max=2048) String url,@NotBlank @Size(max=200) String title,
  @NotBlank @Size(min=20,max=4000) String description,@NotBlank @Pattern(regexp="PHISHING|UPI_FRAUD|KYC_SCAM|OTP_THEFT|SIM_SWAP|RANSOMWARE|VISHING|OTHER") String category,
  @Size(max=100) String state,@Email @Size(max=254) String contactEmail){}
 @PostMapping("/api/reports") @ResponseStatus(HttpStatus.CREATED)
 public Map<String,Object> submit(@Valid @RequestBody Input input,Principal user,HttpServletRequest request){
  rate.check("reports:"+user.getName(),true);UrlHeuristics.host(input.url());CitizenReport report=new CitizenReport();report.setUrl(input.url());report.setTitle(input.title());report.setDescription(input.description());report.setCategory(input.category());report.setState(input.state());report.setContactEmail(input.contactEmail());report.setSubmittedBy(user.getName());CitizenReport saved=reports.save(report);
  return Map.of("id",saved.getId(),"status","RECEIVED","createdAt",saved.getCreatedAt(),"message","Received by CyberLens for review. This does not file an official complaint.");
 }
}
