---
layout: layouts/product.njk
tags: products
title: Extropian Render
description: Modular ECS-based renderer with built-in interaction, shaders, and gizmo support for any GL backend.
tagline: A modular, ECS-based renderer with built-in interaction, shaders, and gizmo support for any GL backend.
category: [visualization-interaction]
type: Modular repository
licensing: ["Source Available (PolyForm Shield)", "Binary Distribution (Proprietary)", "Internal Use (Proprietary)"]
builtFor: build
order: 6
featuredOnHome: false
capabilities:
  - ECS-based scene architecture for large, dynamic engineering scenes
  - Built-in interaction, shaders, and gizmo support
  - Backend-agnostic — supports any GL context
  - Composable rendering pipeline for domain-specific visualization
foundation:
  - The rendering core used by Extropian CAE Workbench and the demo pipeline
  - ECS design keeps scenes modular and extensible
  - Gizmo and interaction primitives built in rather than bolted on
related:
  - spatialui
  - viz
  - assets
---
Extropian Render is the visualization core of the ecosystem: a modular, ECS-based renderer with interaction, shaders, and gizmo support built in, and no loyalty to a single GL backend. Scenes are data — entities and components — which keeps engineering visualizations modular, extensible, and composable with the rest of the stack.
