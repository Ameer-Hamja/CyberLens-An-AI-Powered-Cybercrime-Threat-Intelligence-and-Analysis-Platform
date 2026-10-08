package com.crimelens.backend.shield;
import com.crimelens.backend.repository.ThreatRepository;
import com.crimelens.backend.mapper.ThreatMapper;
import com.crimelens.backend.dto.ThreatDTO;
import com.crimelens.backend.controller.StatsController;
import com.crimelens.backend.dto.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import lombok.RequiredArgsConstructor;
import java.security.Principal;
import java.util.List;
@RestController @RequiredArgsConstructor @Validated
public class ShieldController {
    private final ShieldScanService scans;private final ShieldRateLimiter rate;private final ThreatRepository threats;private final ThreatMapper mapper;private final StatsController stats;
    public record UrlInput(@NotBlank @Size(max=2048) String url){}
    public record TextInput(@NotBlank @Size(min=3,max=2000) String text){}
    private void limit(HttpServletRequest req,Principal principal){rate.check(principal==null?"ip:"+req.getRemoteAddr():"user:"+principal.getName(),principal!=null);}
    @PostMapping("/api/scan/url") public ShieldVerdict url(@Valid @RequestBody UrlInput body,HttpServletRequest req,Principal user){limit(req,user);return scans.scan(body.url(),true);}
    @PostMapping("/api/scan/text") public ShieldVerdict text(@Valid @RequestBody TextInput body,HttpServletRequest req,Principal user){limit(req,user);return scans.scan(body.text(),false);}
    @GetMapping("/api/alerts/recent") public List<ThreatDTO> alerts(@RequestParam(defaultValue="10") @Min(1) @Max(50) int limit){return mapper.toDTOList(threats.findAllByOrderByCreatedAtDesc(org.springframework.data.domain.PageRequest.of(0,limit)).getContent());}
    @GetMapping("/api/stats/summary") public Object summary(){return stats.getStats().getData();}
    @ExceptionHandler(org.springframework.web.server.ResponseStatusException.class) public ResponseEntity<ApiResponse<Object>> error(org.springframework.web.server.ResponseStatusException e){return ResponseEntity.status(e.getStatusCode()).header("Retry-After","60").body(ApiResponse.error(e.getReason()));}
}
