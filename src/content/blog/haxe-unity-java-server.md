---
title: "Cross-Platform Game Logic: Using Haxe for Unity C# and Java Servers"
date: 2026-02-26
draft: false
tags: ["haxe", "unity", "java", "game-development", "architecture"]
categories: ["technical"]
summary: "Learn how to write authoritative game logic once in Haxe and compile it to both C# for Unity and Java for your backend, ensuring perfect sync between client prediction and server validation."
showtoc: true
---

One of the most persistent challenges in multiplayer game development is keeping the client and server perfectly in sync while avoiding code duplication. If your client is written in Unity (C#) and your server is authoritative and written in Java, you often end up writing the exact same game logic twice. This leads to subtle bugs, desyncs, and a maintenance nightmare.

There is a powerful solution to this problem: **Haxe**.

[Haxe](https://haxe.org/) is a strictly typed, high-level programming language that compiles to many different target languages, including C# and Java. By writing your core game logic in Haxe, you can compile it directly into C# source code for your Unity client and Java source code for your server.

This approach works incredibly well for both realtime UDP-based games (where client prediction is crucial) and batched web-service/RPC architectures.

## The Architecture Overview

The core idea is to completely isolate the rules of your game—the "game logic"—into a stateless Haxe library. This library doesn't know about Unity GameObjects, networking protocols, or database connections. It only knows about data and the rules that govern how that data changes.

1.  **Externalized Data:** Game data (like weapon stats, health points, etc.) is externalized, often as JSON. The server loads this data on startup and sends it to the client (or the client downloads it from a CDN).
2.  **Shared Logic (Haxe):** The Haxe script defines the actions (e.g., `AttackAction`) and the simulation step functions that apply those actions to the game state.
3.  **Client Prediction (Unity/C#):** When a player swings a sword, the Unity client creates an `AttackAction`, passes it to the Haxe-generated C# logic, and immediately simulates the result to provide instant visual feedback (client prediction). The action is then sent to the server.
4.  **Server Validation (Java):** The server receives the `AttackAction`. Because it runs the exact same Haxe-generated Java logic, it applies the action to its authoritative state. If the client's predicted state matches the server's state, everything proceeds smoothly. If not, the server forces the client to reconcile.

## Sample Haxe Code: The Combat System

Let's look at a simple example where a player hits an enemy with a sword.

```haxe
// GameState.hx
package logic;

class GameState {
    public var targetHealth:Int;
    public var weaponDamage:Int;

    public function new(health:Int, damage:Int) {
        this.targetHealth = health;
        this.weaponDamage = damage;
    }
}

// AttackAction.hx
package logic;

class AttackAction {
    public var attackerId:String;
    public var targetId:String;
    public var timestamp:Float;

    public function new(attackerId:String, targetId:String, timestamp:Float) {
        this.attackerId = attackerId;
        this.targetId = targetId;
        this.timestamp = timestamp;
    }
}

// CombatSystem.hx
package logic;

class CombatSystem {
    public static function processAttack(state:GameState, action:AttackAction):Void {
        // In a real game, you would validate distance, cooldowns, etc.
        // For this example, we simply apply the externalized weapon damage.

        if (state.targetHealth > 0) {
            state.targetHealth -= state.weaponDamage;
            if (state.targetHealth < 0) {
                state.targetHealth = 0;
            }
        }
    }
}
```

To compile this to C# and Java, you would use a `build.hxml` file:

```hxml
-cp src
logic.CombatSystem
logic.GameState
logic.AttackAction
--each

-cs export/csharp
--next

-java export/java
```

## Integrating with the Unity Client (C#)

In Unity, you import the generated C# source code. When the player clicks to attack, you predict the outcome locally.

```csharp
using UnityEngine;
using logic; // The Haxe-generated namespace

public class PlayerController : MonoBehaviour {
    private GameState localState;
    private NetworkClient network;

    void Start() {
        // In reality, this data comes from the server/CDN
        localState = new GameState(100, 15);
    }

    void Update() {
        if (Input.GetButtonDown("Fire1")) {
            // 1. Create the action
            AttackAction action = new AttackAction("player1", "enemy1", Time.time);

            // 2. Client Prediction: Run the exact same logic the server will run
            CombatSystem.processAttack(localState, action);

            // Update UI/Visuals immediately based on localState.targetHealth
            Debug.Log($"Predicted Enemy Health: {localState.targetHealth}");

            // 3. Send the action to the server
            network.SendAction(action);
        }
    }
}
```

## Integrating with the Authoritative Server (Java)

On the server side (perhaps using Spring Boot, Netty, or a custom UDP server), you receive the action and validate it using the generated Java code.

```java
import logic.GameState;
import logic.AttackAction;
import logic.CombatSystem;

public class GameRoom {
    // Authoritative state loaded from database/config
    private GameState serverState = new GameState(100, 15);

    public void handleIncomingAction(byte[] payload) {
        // 1. Deserialize the payload into an AttackAction
        AttackAction action = NetworkSerializer.deserializeAttack(payload);

        // 2. Validate and process the action using the shared logic
        CombatSystem.processAttack(serverState, action);

        System.out.println("Authoritative Enemy Health: " + serverState.targetHealth);

        // 3. Broadcast the new authoritative state back to clients
        broadcastState(serverState);
    }
}
```

## The Advantages of this Approach

1.  **Single Source of Truth:** Game rules are defined exactly once. When the designer tweaks how armor mitigation works, you update the Haxe code, and both the Unity client and Java server get the exact same update.
2.  **Eliminates Desyncs:** Because the client and server are running logically identical code derived from the same Abstract Syntax Tree, floating-point math (if handled carefully) and conditional logic will evaluate the exact same way.
3.  **Performant:** Haxe doesn't run in a virtual machine inside your target language. It compiles down to native C# and native Java source code, meaning it runs as fast as if you had written it by hand in those languages.
4.  **Flexibility:** This approach is completely network-agnostic. Whether you are sending UDP packets at 60 ticks per second, or batching actions into HTTP POST requests for an asynchronous mobile game, the core state manipulation remains identical.

By strictly isolating your data from your logic, and utilizing a cross-compiler like Haxe, you can build incredibly robust, cheat-resistant, and highly responsive multiplayer games.