# Sprint Escape - PhaserJS MVP Design

**Working Title:** Sprint Escape MVP
**Date:** 2026-03-06

## 1. Architecture & Project Structure

For this MVP, we will use a straightforward Object-Oriented approach built on top of Phaser 3's built-in systems, specifically utilizing `Phaser.GameObjects.Container` as the foundation for our interactive elements.

**Scenes:**
1.  **BootScene:** Handles loading assets (placeholder sprites, fonts, sounds).
2.  **MainGameScene:** The core gameplay loop. This scene manages the Kanban board layout, the deck of cards, and the sprint timer.
3.  **UIScene:** Overlaid on top of `MainGameScene` to display global resources (Budget, Morale, Tech Health, Reputation) and current sprint status, keeping them separate from board logic.

**Core Entities:**
The game logic will revolve around a central `GameManager` class (a simple singleton or property of the MainGameScene) that tracks global state.

The board itself will be managed by a `BoardController`, responsible for initializing the Kanban columns (`Backlog`, `In Progress`, `Review`, `Done`) and ensuring cards are visually positioned correctly when snapped to a column.

**Data Management:**
Card data (stats, names, types) will be decoupled from the visual representation. We'll load a JSON file during the BootScene defining the base archetypes for `Devs` and `Tickets`. When a card is spawned, a `Phaser.GameObjects.Container` subclass will read from this data to configure its visual state and internal logic.

## 2. Component Design & Stacking Logic

The core building blocks are `CardContainer` (a subclass of `Phaser.GameObjects.Container`) and `KanbanColumn` (a spatial zone for organization).

`CardContainer` will handle the visual representation:
1.  **Background Sprite:** Represents the card's physical shape and boundary.
2.  **Text Fields:** For title, stats, and requirements (e.g., "Frontend").
3.  **Visual Indicators:** A progress bar (built with `Phaser.GameObjects.Graphics`) that fills as work is done.
4.  **Drag Handlers:** Using Phaser's built-in drag events (`dragstart`, `drag`, `dragend`).

We will extend `CardContainer` into two main types:
-   **`DevCard`:** Represents the worker. Tracks skills, name, and current assignment. It can be dragged.
-   **`TicketCard`:** Represents the work. Tracks required skills, progress, and max work required. It can also be dragged between columns.

**Stacking & Snap Logic**

Stacking logic is resolved on the `dragend` event. When a `DevCard` is dropped, the `BoardController` checks what it overlaps with using collision detection or distance checks between card centers:

1.  **Drop on TicketCard:** If a DevCard overlaps a TicketCard with open capacity, it "snaps" to it (visually offsets slightly). The system creates an association: the Dev is now "working" that Ticket.
2.  **Drop on ColumnZone:** If a DevCard or TicketCard overlaps empty space in a KanbanColumn, it snaps to the nearest available grid slot within that column.
3.  **Invalid Drop:** If dropped outside a valid zone or on an invalid target (e.g., wrong skills), it animates back to its original position.

The Kanban columns act as simple arrays holding references to the cards inside them, ensuring cards stay visually organized and flow logically.

## 3. Game Loop, Data Flow & Automatic Movement

**The Game Loop & Progress Bars**

The core of the "Sprint Phase" happens within Phaser's `update(time, delta)` loop in the `MainGameScene`.
Each frame, the `GameManager` iterates over all `TicketCards` currently on the board.
If a `TicketCard` has one or more `DevCards` stacked on it, the `GameManager` increases the ticket's progress value based on the delta time and the devs' working speed stats.
The `TicketCard`'s visual progress bar (drawn with `Phaser.GameObjects.Graphics`) is cleared and redrawn to reflect this new value.

**Data Flow: Semi-Automatic Movement**

The MVP will implement the "semi-automatic sliding" design constraint.
When a `TicketCard` reaches 100% progress in a column, the system triggers a transition event:
1.  **Detach:** Any attached `DevCards` are automatically popped off the stack, animating slightly to the side or snapping to a nearby "free" zone. They are now idle.
2.  **Slide:** The `TicketCard`'s progress bar is reset to 0, and the `BoardController` animates the card sliding to the next logical column (e.g., from "In Progress" to "Review").
3.  **Requirements Update:** The ticket may update its required state (e.g., a "Review" phase might require a different dev skill than the "In Progress" phase).

**The Sprint Timer**

A global sprint timer ticks down simultaneously. This is a simple visual countdown in the UI. When it hits zero, the `MainGameScene` pauses the core update loop, transitioning to a simple "Sprint Review" modal overlay that tallies completed `TicketCards` in the "Done" column and adds Budget to the global state.