---
title: "Sharing Game Logic Across Client and Server Using JavaScript"
date: 2026-03-01
draft: false
tags: ["game-development", "javascript", "csharp", "java", "architecture"]
categories: ["engineering"]
summary: "Exploring how to write shared, authoritative game logic in JavaScript that runs locally in Unity (C#) and verifies securely on the server (Java)."
showtoc: true
---

A common challenge in multiplayer game development is code duplication. You want the client to run logic locally for immediate feedback, but the server must independently verify that same logic to prevent cheating. Often, this means writing the exact same skill, combat, or movement code twice: once in C# for the Unity client, and once in Java (or C++, Go, etc.) for the server.

What if we could write this logic once and run it everywhere?

In this post, we'll look at a powerful architecture: writing game logic in **JavaScript** and embedding a JS engine in both the Unity C# client and the Java server. This approach works seamlessly whether your game uses real-time UDP streams or batched web-service/RPC calls.

## The Goal: Write Once, Run Everywhere

The idea is that core game rules (e.g., combat calculations, stat modifiers, skill effects) are completely isolated in JavaScript scripts.

When a player performs an action:
1. **The Client** runs the JS logic locally to provide instant visual feedback (prediction).
2. **The Server** receives the player's input and runs the *exact same JS logic* to validate the action and update the authoritative game state.

Because both ends use the same script and the same static data, the outcomes are guaranteed to match.

## A Practical Example: The Sword Strike

Imagine a scenario where a player hits an enemy with a sword. The damage dealt depends on the player's stats, the weapon's base damage, and the enemy's armor. All of this relies on externalized data (often referred to as game data or config data) that the client receives from the server on startup.

Here is what the shared JavaScript logic might look like:

```javascript
// shared-combat.js

/**
 * Calculates damage for a melee strike.
 *
 * @param {Object} context - An injected service to lookup game data.
 * @param {Object} actionInfo - A protobuf message representing the player's action.
 * @returns {Object} A protobuf message representing the combat result.
 */
function calculateMeleeStrike(context, actionInfo) {
    // 1. Look up static data via the injected C#/Java service
    const weaponData = context.GetWeaponData(actionInfo.weaponId);
    const targetStats = context.GetTargetStats(actionInfo.targetId);

    // 2. Perform game logic calculations
    let baseDamage = weaponData.baseDamage + actionInfo.playerStrength;
    let finalDamage = Math.max(1, baseDamage - targetStats.armor);

    // Critical hit chance
    if (Math.random() < weaponData.critChance) {
        finalDamage *= 1.5;
    }

    // 3. Modify and return the result (which could be a Protobuf message)
    const result = context.CreateResultProto();
    result.damageDealt = Math.floor(finalDamage);
    result.targetId = actionInfo.targetId;
    result.isValid = true;

    return result;
}
```

## Integration and Interoperability

To make this work, the host languages (C# and Java) need to evaluate the JavaScript and pass data back and forth.

### Interoperating with C# (Unity Client)

In Unity, you can use a library like [Jint](https://github.com/sebastienros/jint) or [ClearScript](https://github.com/microsoft/ClearScript) to embed a V8 or pure C# JavaScript engine.

You can inject C# services directly into the JS environment:

```csharp
using Jint;

public class GameDataContext
{
    public WeaponData GetWeaponData(string id) { /* Fetch from local cache */ return null; }
    public TargetStats GetTargetStats(string id) { /* Fetch from local cache */ return null; }
    public CombatResultProto CreateResultProto() { return new CombatResultProto(); }
}

public class CombatEngine
{
    private Engine jsEngine;

    public void Initialize(string jsCode)
    {
        jsEngine = new Engine()
            .SetValue("context", new GameDataContext())
            .Execute(jsCode);
    }

    public CombatResultProto ExecuteStrike(ActionInfoProto action)
    {
        // Call the JS function and pass the Protobuf message
        var result = jsEngine.Invoke("calculateMeleeStrike", jsEngine.GetValue("context"), action);
        return result.ToObject() as CombatResultProto;
    }
}
```

Notice how `action` (a Protobuf message) is passed directly to the JS engine. The script modifies the object or creates a new one via the injected factory `CreateResultProto()`, returning a strongly-typed C# object.

### Interoperating with Java (Authoritative Server)

On the server side, we can achieve the same result using GraalVM. GraalVM provides a highly optimized JavaScript engine that integrates perfectly with Java.

```java
import org.graalvm.polyglot.*;

public class ServerCombatEngine {
    private Context polyglot;
    private Value calculateFunction;
    private GameDataContext contextService;

    public void initialize(String jsCode) {
        polyglot = Context.newBuilder("js")
            .allowAllAccess(true)
            .build();

        contextService = new GameDataContext(); // Java service implementation
        polyglot.getBindings("js").putMember("context", contextService);

        polyglot.eval("js", jsCode);
        calculateFunction = polyglot.getBindings("js").getMember("calculateMeleeStrike");
    }

    public CombatResultProto executeStrike(ActionInfoProto action) {
        // Pass the Java Protobuf object to the JS function
        Value result = calculateFunction.execute(contextService, action);
        return result.as(CombatResultProto.class);
    }
}
```

## Running at Java Speed in the JVM

A major concern with embedded scripting on an authoritative game server is performance. A server might process thousands of combat calculations per second. If the JS runs slowly or generates garbage, the server will lag.

Fortunately, using **GraalVM** allows JavaScript to run at near-native Java speeds with almost zero overhead. Here is how you ensure maximum performance:

1. **Pass References, Don't Serialize:** Notice that we are passing the Protobuf objects and service references *directly* into the JS engine. We are not serializing data to JSON strings and parsing them back. GraalVM (and Jint/ClearScript) allows JS to interact directly with host objects via memory references. This eliminates serialization overhead.
2. **Pre-compile the Scripts:** Don't call `eval()` on every request. Evaluate the script once during server startup and cache the function references (as seen with `calculateFunction.execute()`).
3. **Avoid Garbage Collection Spikes:** By using factory methods (`context.CreateResultProto()`) to instantiate objects in the host language, you rely on the JVM's highly optimized garbage collector rather than creating temporary JS objects. Alternatively, pass in a pre-allocated "Result" object that the JS merely mutates.
4. **GraalVM JIT Compilation:** GraalVM's Enterprise compiler profiles polyglot code and heavily optimizes JS execution by inline-caching and compiling it directly into JVM machine code. To the CPU, the JS execution path eventually looks identical to native Java code.

## Advantages of the Shared JS Approach

1. **Zero Logic Duplication:** Bugs are fixed once. Features are implemented once.
2. **Cheat Prevention:** The server maintains true authority. If a client tampers with their local JS to deal 9999 damage, the server will still run the pristine server-side JS, calculate the real damage, and reject the client's invalid state.
3. **Hot-Reloading and Live Updates:** Scripts can be updated without recompiling the entire C# Unity game or the Java server. You can push live balance tweaks to combat formulas simply by sending a new `.js` file or string to the clients and servers.
4. **Data-Driven Design:** Game designers can write or tweak JS formulas without needing a software engineer to recompile the monolithic server/client codebases.

By bridging C# and Java with JavaScript, you create a flexible, secure, and incredibly fast workflow for multiplayer game development.
