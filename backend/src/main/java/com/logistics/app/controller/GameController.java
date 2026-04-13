package com.logistics.app.controller;

import com.logistics.app.dto.GameDtos;
import com.logistics.app.game.QuickDrawGameService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/public/game/quickdraw")
public class GameController {
    private final QuickDrawGameService quickDrawGameService;

    public GameController(QuickDrawGameService quickDrawGameService) {
        this.quickDrawGameService = quickDrawGameService;
    }

    @PostMapping("/rooms")
    public GameDtos.RoomSnapshot createRoom(@RequestBody(required = false) GameDtos.CreateRoomRequest request) {
        String playerName = request == null ? null : request.getPlayerName();
        return quickDrawGameService.createRoom(playerName);
    }

    @PostMapping("/rooms/join")
    public GameDtos.RoomSnapshot joinRoom(@RequestBody GameDtos.JoinRoomRequest request) {
        return quickDrawGameService.joinRoom(request.getRoomCode(), request.getPlayerName());
    }

    @GetMapping("/rooms/{roomCode}")
    public GameDtos.RoomSnapshot getRoom(@PathVariable String roomCode,
                                         @RequestParam(required = false) String playerId) {
        return quickDrawGameService.getRoom(roomCode, playerId);
    }

    @MessageMapping("/game/quickdraw/ready")
    public void toggleReady(GameDtos.PlayerActionRequest request) {
        quickDrawGameService.toggleReady(request.getRoomCode(), request.getPlayerId());
    }

    @MessageMapping("/game/quickdraw/fire")
    public void fire(GameDtos.PlayerActionRequest request) {
        quickDrawGameService.fire(request.getRoomCode(), request.getPlayerId());
    }
}
