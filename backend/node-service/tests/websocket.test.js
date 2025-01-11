const WebSocket = require('ws');
const { createServer } = require('http');
const { Server } = require('../src/server');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const { EventEmitter } = require('events');
const { WebSocketServer } = require('ws');
const { config } = require('../src/config/config');
const { RoomManager } = require('../src/services/room');
const { AuthService } = require('../src/services/auth');
const wait = promisify(setTimeout);

describe('WebSocket Server Tests', () => {
    let httpServer;
    let wss;
    let serverUrl;
    let mockToken;

    beforeAll(() => {
        httpServer = createServer();
        wss = new Server({ server: httpServer });
        const port = 8080;
        httpServer.listen(port);
        serverUrl = `ws://localhost:${port}`;
        
        // Create a mock JWT token
        mockToken = jwt.sign(
            { userId: '123', email: 'test@example.com' },
            process.env.JWT_SECRET || 'test-secret'
        );
    });

    afterAll((done) => {
        wss.close(() => {
            httpServer.close(done);
        });
    });

    afterEach(() => {
        // Close all client connections
        wss.clients.forEach(client => {
            client.close();
        });
    });

    test('Connection with valid token', (done) => {
        const ws = new WebSocket(serverUrl, {
            headers: { Authorization: `Bearer ${mockToken}` }
        });

        ws.on('open', () => {
            expect(ws.readyState).toBe(WebSocket.OPEN);
            ws.close();
            done();
        });
    });

    test('Connection rejected with invalid token', (done) => {
        const ws = new WebSocket(serverUrl, {
            headers: { Authorization: 'Bearer invalid-token' }
        });

        ws.on('error', (error) => {
            expect(error).toBeTruthy();
            done();
        });
    });

    test('Join meeting room', (done) => {
        const ws = new WebSocket(serverUrl, {
            headers: { Authorization: `Bearer ${mockToken}` }
        });

        ws.on('open', () => {
            ws.send(JSON.stringify({
                type: 'join_room',
                roomId: 'test-room-123'
            }));
        });

        ws.on('message', (data) => {
            const message = JSON.parse(data);
            expect(message.type).toBe('room_joined');
            expect(message.roomId).toBe('test-room-123');
            ws.close();
            done();
        });
    });

    test('Broadcast messages in room', async () => {
        const client1 = new WebSocket(serverUrl, {
            headers: { Authorization: `Bearer ${mockToken}` }
        });
        const client2 = new WebSocket(serverUrl, {
            headers: { Authorization: `Bearer ${mockToken}` }
        });

        // Join same room
        const roomId = 'test-room-456';
        
        await Promise.all([
            new Promise(resolve => client1.on('open', resolve)),
            new Promise(resolve => client2.on('open', resolve))
        ]);

        client1.send(JSON.stringify({
            type: 'join_room',
            roomId
        }));

        client2.send(JSON.stringify({
            type: 'join_room',
            roomId
        }));

        // Wait for room joins to complete
        await wait(100);

        // Test message broadcast
        return new Promise((resolve) => {
            client2.on('message', (data) => {
                const message = JSON.parse(data);
                if (message.type === 'chat_message') {
                    expect(message.content).toBe('Hello room!');
                    client1.close();
                    client2.close();
                    resolve();
                }
            });

            client1.send(JSON.stringify({
                type: 'chat_message',
                roomId,
                content: 'Hello room!'
            }));
        });
    });

    test('WebRTC signaling', (done) => {
        const client1 = new WebSocket(serverUrl, {
            headers: { Authorization: `Bearer ${mockToken}` }
        });
        const client2 = new WebSocket(serverUrl, {
            headers: { Authorization: `Bearer ${mockToken}` }
        });

        const roomId = 'test-room-789';
        let client2Connected = false;

        client1.on('open', () => {
            client1.send(JSON.stringify({
                type: 'join_room',
                roomId
            }));
        });

        client2.on('open', () => {
            client2Connected = true;
            client2.send(JSON.stringify({
                type: 'join_room',
                roomId
            }));
        });

        client2.on('message', (data) => {
            const message = JSON.parse(data);
            if (message.type === 'webrtc_offer') {
                expect(message.offer).toBe('test-offer-data');
                client1.close();
                client2.close();
                done();
            }
        });

        // Wait for both clients to connect and join room
        const checkAndSendOffer = setInterval(() => {
            if (client2Connected) {
                clearInterval(checkAndSendOffer);
                client1.send(JSON.stringify({
                    type: 'webrtc_offer',
                    roomId,
                    offer: 'test-offer-data'
                }));
            }
        }, 100);
    });
}); 