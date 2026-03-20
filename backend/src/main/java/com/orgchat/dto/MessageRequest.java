package com.orgchat.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MessageRequest {

    @NotBlank(message = "Recipient ID is required")
    private String recipientId;

    private String content;

    private String mediaId;   // Optional — attach existing media
}
