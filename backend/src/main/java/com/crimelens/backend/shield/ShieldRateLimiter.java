package com.crimelens.backend.shield;
import org.springframework.stereotype.Service;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import lombok.RequiredArgsConstructor;
@Service @RequiredArgsConstructor
public class ShieldRateLimiter {
    private final StringRedisTemplate redis;
    private final Map<String,Window> fallback = new ConcurrentHashMap<>();
    private record Window(long minute,int count) {}
    public static String hash(String value){try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));}catch(Exception e){throw new IllegalStateException(e);}}
    public void check(String identity,boolean authenticated){
        String key="shield:rate:"+hash(identity); long count;
        try {Long result=redis.execute(new DefaultRedisScript<>("local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],60) end; return n",Long.class),List.of(key));count=Objects.requireNonNull(result);}
        catch(Exception e){long minute=System.currentTimeMillis()/60000;if(fallback.size()>10000)fallback.entrySet().removeIf(entry->entry.getValue().minute()<minute);count=fallback.compute(key,(k,v)->new Window(minute,v==null||v.minute()!=minute?1:v.count()+1)).count();}
        if(count>(authenticated?90:30))throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,"Scan quota exceeded; try again in 60 seconds");
    }
}
