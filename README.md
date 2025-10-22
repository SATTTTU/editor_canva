# Visual Design Editor

A web-based visual design editor built with Next.js, React, Konva, and a PostgreSQL backend. This application allows users to create multi-layered designs, manipulate layers, and save/export their work, similar to modern design tools like Canva.

## Core Features Implemented

-   [x] **Base Image Upload**: Users can upload an image from their disk to serve as the canvas background.
-   [x] **Asset Gallery & Overlays**: Upload additional images ("assets") which are added to a gallery and can be placed on the canvas as new layers.
-   [x] **Layer Transformations**: The selected layer can be dragged, resized, rotated, and flipped (horizontally/vertically).
-   [x] **Per-Layer Cropping**: A rectangular, non-destructive crop can be applied to any selected image layer.
-   [x] **Layer Panel**: A dedicated UI panel lists all layers, supports re-ordering (z-index), toggling visibility, and deletion.
-   [x] **Persistence**: Designs can be saved to a PostgreSQL database and re-loaded into the editor, preserving all layer states.
-   [x] **Server-Side Export**: Compositions can be exported as a flattened PNG file, with all transformations rendered accurately by a server-side process.

## Tech Stack

-   **Frontend**: Next.js (App Router), React, Redux Toolkit, Konva.js, Tailwind CSS
-   **Backend**: Next.js API Routes, Prisma ORM
-   **Database**: PostgreSQL
-   **Image Processing**: Sharp

## Setup & Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-name>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up the Database:**
    -   Ensure you have PostgreSQL running.
    -   Create a `.env` file in the root of the project.
    -   Add your database connection string to the `.env` file:
        ```env
        DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
        ```

4.  **Run Prisma Migrations:**
    This will apply the database schema (`prisma/schema.prisma`) to your database.
    ```bash
    npx prisma migrate dev --name init
    ```

5.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

## Design & Implementation Decisions

#### State Management: Redux Toolkit
Redux Toolkit was chosen for its robust, centralized state management, which is ideal for a complex UI like an editor. It simplifies state synchronization between components (Toolbar, Layer Panel, Canvas) and provides a clear pattern for handling asynchronous actions like saving and loading designs.

#### Canvas Library: Konva.js
Konva.js (with `react-konva`) provides a declarative, object-oriented API for the HTML5 canvas, which aligns perfectly with React's component model. It handles complex tasks like event detection, transformations (drag, resize, rotate), and layering out-of-the-box, significantly reducing development time compared to the vanilla Canvas API.

#### Persistence Strategy
-   **Database**: PostgreSQL with Prisma ORM offers a type-safe, relational data structure perfect for storing designs, layers, and asset metadata. The normalized schema ensures data integrity.
-   **Assets**: Uploaded images are stored on the server's local filesystem (`/public/uploads`) and referenced via a URL in the database. This is a simple and effective strategy for self-hosted applications. For scalability, this could be swapped for a cloud object storage service like AWS S3.

#### Export Pipeline: Server-Side with Sharp
Exporting is handled by a dedicated API endpoint that uses the `sharp` library. This server-side approach was chosen for:
-   **Quality & Reliability**: Rendering is consistent and not dependent on the client's browser or hardware. It avoids cross-origin canvas tainting issues.
-   **Performance**: Offloads heavy image processing from the client, preventing the UI from freezing on complex designs.
-   **Security**: The server works with files it manages directly, reducing the attack surface.

#### Cropping Implementation: Per-Layer, Non-Destructive
Cropping is implemented on a per-layer basis, which is more flexible than a global crop. The crop is non-destructive, meaning the original image asset is never altered. Instead, `cropX, cropY, cropW, cropH` coordinates are stored on the `Layer` model. Konva's `Image` component and Sharp's `extract` function both use these coordinates to render the cropped view, ensuring consistency between the editor and the final export.