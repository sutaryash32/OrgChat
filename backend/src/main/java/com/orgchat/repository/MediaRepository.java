package com.orgchat.repository;

import com.orgchat.model.Media;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MediaRepository extends MongoRepository<Media, String> {

    List<Media> findByUploaderId(String uploaderId);

    List<Media> findByUploaderIdOrderByTimestampDesc(String uploaderId);
}
