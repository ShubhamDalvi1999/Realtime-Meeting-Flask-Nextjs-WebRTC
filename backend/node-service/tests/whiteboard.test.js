const WebSocket = require('ws');
const { createServer } = require('http');
const { Server } = require('../src/server');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const { EventEmitter } = require('events');
const { WebSocketServer } = require('ws');
const { config } = require('../src/config/config');
const { WhiteboardManager } = require('../src/services/whiteboard');
const { RoomManager } = require('../src/services/room');
const { AuthService } = require('../src/services/auth');
const wait = promisify(setTimeout);

describe('Whiteboard Tests', () => {
    let httpServer;
    let wss;
    let serverUrl;
    let mockToken;

    beforeAll(() => {
        httpServer = createServer();
        wss = new Server({ server: httpServer });
        const port = 8081;
        httpServer.listen(port);
        serverUrl = `ws://localhost:${port}`;
        
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
        wss.clients.forEach(client => {
            client.close();
        });
    });

    test('Draw line broadcast', async () => {
        const client1 = new WebSocket(serverUrl, {
            headers: { Authorization: `Bearer ${mockToken}` }
        });
        const client2 = new WebSocket(serverUrl, {
            headers: { Authorization: `Bearer ${mockToken}` }
        });

        const roomId = 'whiteboard-test-room';
        
        // Wait for connections
        await Promise.all([
            new Promise(resolve => client1.on('open', resolve)),
            new Promise(resolve => client2.on('open', resolve))
        ]);

        // Join room
        client1.send(JSON.stringify({
            type: 'join_room',
            roomId
        }));

        client2.send(JSON.stringify({
            type: 'join_room',
            roomId
        }));

        await wait(100);

        // Test drawing broadcast
        return new Promise((resolve) => {
            const drawData = {
                type: 'draw_line',
                roomId,
                data: {
                    startX: 100,
                    startY: 100,
                    endX: 200,
                    endY: 200,
                    color: '#000000',
                    thickness: 2
                }
            };

            client2.on('message', (data) => {
                const message = JSON.parse(data);
                if (message.type === 'draw_line') {
                    expect(message.data).toEqual(drawData.data);
                    client1.close();
                    client2.close();
                    resolve();
                }
            });

            client1.send(JSON.stringify(drawData));
        });
    });

    test('Clear whiteboard', async () => {
        const client1 = new WebSocket(serverUrl, {
            headers: { Authorization: `Bearer ${mockToken}` }
        });
        const client2 = new WebSocket(serverUrl, {
            headers: { Authorization: `Bearer ${mockToken}` }
        });

        const roomId = 'whiteboard-clear-test';
        
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

        await wait(100);

        return new Promise((resolve) => {
            client2.on('message', (data) => {
                const message = JSON.parse(data);
                if (message.type === 'clear_whiteboard') {
                    expect(message.roomId).toBe(roomId);
                    client1.close();
                    client2.close();
                    resolve();
                }
            });

            client1.send(JSON.stringify({
                type: 'clear_whiteboard',
                roomId
            }));
        });
    });

    test('Change drawing color', async () => {
        const ws = new WebSocket(serverUrl, {
            headers: { Authorization: `Bearer ${mockToken}` }
        });

        const roomId = 'color-test-room';
        
        await new Promise(resolve => ws.on('open', resolve));

        ws.send(JSON.stringify({
            type: 'join_room',
            roomId
        }));

        await wait(100);

        return new Promise((resolve) => {
            ws.send(JSON.stringify({
                type: 'change_color',
                roomId,
                color: '#FF0000'
            }));

            ws.on('message', (data) => {
                const message = JSON.parse(data);
                if (message.type === 'color_changed') {
                    expect(message.color).toBe('#FF0000');
                    ws.close();
                    resolve();
                }
            });
        });
    });

    test('Save whiteboard state', async () => {
        const ws = new WebSocket(serverUrl, {
            headers: { Authorization: `Bearer ${mockToken}` }
        });

        const roomId = 'save-state-test';
        
        await new Promise(resolve => ws.on('open', resolve));

        ws.send(JSON.stringify({
            type: 'join_room',
            roomId
        }));

        await wait(100);

        const drawingState = {
            lines: [
                {
                    startX: 100,
                    startY: 100,
                    endX: 200,
                    endY: 200,
                    color: '#000000',
                    thickness: 2
                }
            ]
        };

        return new Promise((resolve) => {
            ws.send(JSON.stringify({
                type: 'save_whiteboard',
                roomId,
                state: drawingState
            }));

            ws.on('message', (data) => {
                const message = JSON.parse(data);
                if (message.type === 'whiteboard_saved') {
                    expect(message.success).toBe(true);
                    ws.close();
                    resolve();
                }
            });
        });
    });
}); 