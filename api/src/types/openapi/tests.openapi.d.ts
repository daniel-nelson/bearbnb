export interface paths {
    "/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description API status endpoint for frontend connectivity checks */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Status"];
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                500: components["responses"]["InternalServerError"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/guest/bookings": {
        parameters: {
            query?: {
                /** @description Pagination cursor */
                cursor?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Paginated index of Bookings */
        get: {
            parameters: {
                query?: {
                    /** @description Pagination cursor */
                    cursor?: string | null;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            cursor: string | null;
                            results: components["schemas"]["BookingSummary"][];
                        };
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                500: components["responses"]["InternalServerError"];
            };
        };
        put?: never;
        /** @description Create a Booking */
        post: {
            parameters: {
                query?: {
                    /** @description Pagination cursor */
                    cursor?: string | null;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": {
                        /** Format: date */
                        endsOn?: string;
                        /** Format: date */
                        startsOn?: string;
                        placeId?: string;
                    };
                };
            };
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Booking"];
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                500: components["responses"]["InternalServerError"];
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/guest/bookings/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** @description Destroy a Booking */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success, no content */
                204: components["responses"]["NoContent"];
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                500: components["responses"]["InternalServerError"];
            };
        };
        options?: never;
        head?: never;
        /** @description Update a Booking */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": {
                        /** Format: date */
                        endsOn?: string;
                        /** Format: date */
                        startsOn?: string;
                        placeId?: string;
                    };
                };
            };
            responses: {
                /** @description Success, no content */
                204: components["responses"]["NoContent"];
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                500: components["responses"]["InternalServerError"];
            };
        };
        trace?: never;
    };
    "/v1/guest/favorites": {
        parameters: {
            query?: {
                /** @description Pagination cursor */
                cursor?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Paginated index of Favorites */
        get: {
            parameters: {
                query?: {
                    /** @description Pagination cursor */
                    cursor?: string | null;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            cursor: string | null;
                            results: components["schemas"]["FavoriteSummary"][];
                        };
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                500: components["responses"]["InternalServerError"];
            };
        };
        put?: never;
        /** @description Create a Favorite */
        post: {
            parameters: {
                query?: {
                    /** @description Pagination cursor */
                    cursor?: string | null;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": {
                        placeId?: string;
                    };
                };
            };
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Favorite"];
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                500: components["responses"]["InternalServerError"];
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/guest/favorites/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** @description Destroy a Favorite */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success, no content */
                204: components["responses"]["NoContent"];
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                500: components["responses"]["InternalServerError"];
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/guest/reviews": {
        parameters: {
            query?: {
                /** @description Pagination cursor */
                cursor?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Paginated index of Reviews */
        get: {
            parameters: {
                query?: {
                    /** @description Pagination cursor */
                    cursor?: string | null;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            cursor: string | null;
                            results: components["schemas"]["ReviewSummary"][];
                        };
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                500: components["responses"]["InternalServerError"];
            };
        };
        put?: never;
        /** @description Create a Review */
        post: {
            parameters: {
                query?: {
                    /** @description Pagination cursor */
                    cursor?: string | null;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": {
                        body?: string;
                        rating?: number;
                        bookingId?: string;
                    };
                };
            };
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Review"];
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                500: components["responses"]["InternalServerError"];
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/guest/reviews/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** @description Destroy a Review */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success, no content */
                204: components["responses"]["NoContent"];
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                500: components["responses"]["InternalServerError"];
            };
        };
        options?: never;
        head?: never;
        /** @description Update a Review */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": {
                        body?: string;
                        rating?: number;
                    };
                };
            };
            responses: {
                /** @description Success, no content */
                204: components["responses"]["NoContent"];
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                500: components["responses"]["InternalServerError"];
            };
        };
        trace?: never;
    };
    "/v1/host": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Fetch the current User's Host */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Host"];
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                500: components["responses"]["InternalServerError"];
            };
        };
        put?: never;
        /** @description Create the Host for the current User, with multi-locale profile text */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": {
                        legalName: string;
                        /** Format: date-time */
                        signedHostAgreementAt: string;
                        localizedTexts?: {
                            /** @enum {string} */
                            locale: "en-US" | "es-ES";
                            markdown: string | null;
                            title: string | null;
                        }[];
                    };
                };
            };
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Host"];
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                /** @description Missing en-US title and description */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                500: components["responses"]["InternalServerError"];
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        /** @description Update the current Host, adding or removing non-default profile locales */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": {
                        legalName?: string;
                        /** Format: date-time */
                        signedHostAgreementAt?: string;
                        localizedTexts?: {
                            /** @enum {string} */
                            locale: "en-US" | "es-ES";
                            markdown: string | null;
                            title: string | null;
                        }[];
                    };
                };
            };
            responses: {
                /** @description Success, no content */
                204: components["responses"]["NoContent"];
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                500: components["responses"]["InternalServerError"];
            };
        };
        trace?: never;
    };
    "/v1/host/places": {
        parameters: {
            query?: {
                /** @description Pagination cursor */
                cursor?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Paginated index of Places */
        get: {
            parameters: {
                query?: {
                    /** @description Pagination cursor */
                    cursor?: string | null;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            cursor: string | null;
                            results: components["schemas"]["PlaceSummary"][];
                        };
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                500: components["responses"]["InternalServerError"];
            };
        };
        put?: never;
        /** @description Create a Place, with multi-locale localized text */
        post: {
            parameters: {
                query?: {
                    /** @description Pagination cursor */
                    cursor?: string | null;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": {
                        name?: string;
                        sleeps?: number;
                        /** @enum {string} */
                        style?: "cabin" | "cave" | "cottage" | "dump" | "lean_to" | "tent" | "treehouse";
                        localizedTexts?: {
                            /** @enum {string} */
                            locale: "en-US" | "es-ES";
                            markdown: string | null;
                            title: string | null;
                        }[];
                    };
                };
            };
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Place"];
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                /** @description Missing en-US title and description */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                500: components["responses"]["InternalServerError"];
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/host/places/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        /** @description Fetch a Place, with localized text rows and embedded Rooms */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["PlaceForHost"];
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                500: components["responses"]["InternalServerError"];
            };
        };
        put?: never;
        post?: never;
        /** @description Destroy a Place */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success, no content */
                204: components["responses"]["NoContent"];
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                500: components["responses"]["InternalServerError"];
            };
        };
        options?: never;
        head?: never;
        /** @description Update a Place, with multi-locale localized text */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": {
                        name?: string;
                        sleeps?: number;
                        /** @enum {string} */
                        style?: "cabin" | "cave" | "cottage" | "dump" | "lean_to" | "tent" | "treehouse";
                        localizedTexts?: {
                            /** @enum {string} */
                            locale: "en-US" | "es-ES";
                            markdown: string | null;
                            title: string | null;
                        }[];
                    };
                };
            };
            responses: {
                /** @description Success, no content */
                204: components["responses"]["NoContent"];
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                /** @description Missing en-US title and description */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                500: components["responses"]["InternalServerError"];
            };
        };
        trace?: never;
    };
    "/v1/host/places/{placeId}/rooms": {
        parameters: {
            query?: {
                /** @description Pagination cursor */
                cursor?: string | null;
            };
            header?: never;
            path: {
                placeId: string;
            };
            cookie?: never;
        };
        /** @description Paginated index of Rooms */
        get: {
            parameters: {
                query?: {
                    /** @description Pagination cursor */
                    cursor?: string | null;
                };
                header?: never;
                path: {
                    placeId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            cursor: string | null;
                            results: (components["schemas"]["RoomBathroomSummary"] | components["schemas"]["RoomBedroomSummary"] | components["schemas"]["RoomDenSummary"] | components["schemas"]["RoomKitchenSummary"] | components["schemas"]["RoomLivingRoomSummary"])[];
                        };
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                500: components["responses"]["InternalServerError"];
            };
        };
        put?: never;
        /** @description Create a Room, with multi-locale localized text */
        post: {
            parameters: {
                query?: {
                    /** @description Pagination cursor */
                    cursor?: string | null;
                };
                header?: never;
                path: {
                    placeId: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": {
                        appliances?: ("dishwasher" | "microwave" | "oven" | "stove")[];
                        /** @enum {string|null} */
                        bathOrShowerStyle?: "bath" | "bath_and_shower" | "none" | "shower" | null;
                        bedTypes?: ("bunk" | "cot" | "king" | "queen" | "sofabed" | "twin")[];
                        position?: number | null;
                        /** @enum {string} */
                        type?: "Bathroom" | "Bedroom" | "Den" | "Kitchen" | "LivingRoom";
                        localizedTexts?: {
                            /** @enum {string} */
                            locale: "en-US" | "es-ES";
                            markdown: string | null;
                            title: string | null;
                        }[];
                    };
                };
            };
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["RoomBathroom"] | components["schemas"]["RoomBedroom"] | components["schemas"]["RoomDen"] | components["schemas"]["RoomKitchen"] | components["schemas"]["RoomLivingRoom"];
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                /** @description Missing en-US title and description */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                500: components["responses"]["InternalServerError"];
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/host/places/{placeId}/rooms/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                placeId: string;
                id: string;
            };
            cookie?: never;
        };
        /** @description Fetch a Room, with localized text rows for editing/display */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    placeId: string;
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["RoomBathroomForHost"] | components["schemas"]["RoomBedroomForHost"] | components["schemas"]["RoomDenForHost"] | components["schemas"]["RoomKitchenForHost"] | components["schemas"]["RoomLivingRoomForHost"];
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                500: components["responses"]["InternalServerError"];
            };
        };
        put?: never;
        post?: never;
        /** @description Destroy a Room */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    placeId: string;
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success, no content */
                204: components["responses"]["NoContent"];
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                500: components["responses"]["InternalServerError"];
            };
        };
        options?: never;
        head?: never;
        /** @description Update a Room, with multi-locale localized text. The Room type is fixed after creation. */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    placeId: string;
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": {
                        appliances?: ("dishwasher" | "microwave" | "oven" | "stove")[];
                        /** @enum {string|null} */
                        bathOrShowerStyle?: "bath" | "bath_and_shower" | "none" | "shower" | null;
                        bedTypes?: ("bunk" | "cot" | "king" | "queen" | "sofabed" | "twin")[];
                        position?: number | null;
                        localizedTexts?: {
                            /** @enum {string} */
                            locale: "en-US" | "es-ES";
                            markdown: string | null;
                            title: string | null;
                        }[];
                    };
                };
            };
            responses: {
                /** @description Success, no content */
                204: components["responses"]["NoContent"];
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                /** @description Missing en-US title and description */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                500: components["responses"]["InternalServerError"];
            };
        };
        trace?: never;
    };
    "/v1/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Current Firebase-authenticated BearBnB user */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["CurrentUser"];
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                500: components["responses"]["InternalServerError"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/sign-up": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Provision the current Firebase-authenticated user and record terms-of-service consent */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["CurrentUser"];
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                500: components["responses"]["InternalServerError"];
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/visitor/places": {
        parameters: {
            query?: {
                /** @description q */
                q?: string;
                /** @description Pagination cursor */
                cursor?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Place index endpoint for Visitors */
        get: {
            parameters: {
                query?: {
                    /** @description q */
                    q?: string;
                    /** @description Pagination cursor */
                    cursor?: string | null;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            cursor: string | null;
                            results: components["schemas"]["PlaceSummaryForVisitors"][];
                        };
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                500: components["responses"]["InternalServerError"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/visitor/places/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        /** @description Place show endpoint for Visitors */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["PlaceForVisitors"];
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                500: components["responses"]["InternalServerError"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/visitor/places/{id}/availability": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        /** @description Place availability endpoint for Visitors */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["PlaceAvailability"];
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                500: components["responses"]["InternalServerError"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/visitor/places/{placeId}/reviews": {
        parameters: {
            query?: {
                /** @description Pagination cursor */
                cursor?: string | null;
            };
            header?: never;
            path: {
                placeId: string;
            };
            cookie?: never;
        };
        /** @description Paginated review index for a visitor place */
        get: {
            parameters: {
                query?: {
                    /** @description Pagination cursor */
                    cursor?: string | null;
                };
                header?: never;
                path: {
                    placeId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            cursor: string | null;
                            results: components["schemas"]["ReviewVisitorSummary"][];
                        };
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                403: components["responses"]["Forbidden"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                500: components["responses"]["InternalServerError"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        Appliance: {
            label: string;
            /** @enum {string} */
            value: "dishwasher" | "microwave" | "oven" | "stove";
        };
        BathOrShowerStyle: {
            label: string;
            /** @enum {string} */
            value: "bath" | "bath_and_shower" | "none" | "shower";
        };
        BedType: {
            label: string;
            /** @enum {string} */
            value: "bunk" | "cot" | "king" | "queen" | "sofabed" | "twin";
        };
        Booking: {
            /** Format: date */
            endsOn: string;
            id: string;
            placeId: string;
            /** Format: date */
            startsOn: string;
        };
        BookingSummary: {
            /** Format: date */
            endsOn: string;
            id: string;
            placeId: string;
            /** Format: date */
            startsOn: string;
        };
        CurrentUser: {
            email: string;
            id: string;
        };
        Favorite: {
            id: string;
            placeId: string;
        };
        FavoriteSummary: {
            id: string;
            placeId: string;
        };
        Host: {
            id: string;
            legalName: string;
            localizedTexts: components["schemas"]["LocalizedText"][];
            /** Format: date-time */
            signedHostAgreementAt: string;
        };
        LocalizedText: {
            id: string;
            /** @enum {string} */
            locale: "en-US" | "es-ES";
            localizableId: string;
            /** @enum {string} */
            localizableType: "Host" | "Place" | "Room";
            markdown: string | null;
            title: string | null;
        };
        OpenapiValidationErrors: {
            /** @enum {string} */
            type: "openapi";
            /** @enum {string} */
            target: "requestBody" | "query" | "headers" | "responseBody";
            errors: {
                instancePath: string;
                schemaPath: string;
                keyword: string;
                message: string;
                params: Record<string, never>;
            }[];
        };
        Place: {
            id: string;
            name: string;
            sleeps: number;
            /** @enum {string} */
            style: "cabin" | "cave" | "cottage" | "dump" | "lean_to" | "tent" | "treehouse";
        };
        PlaceAvailability: {
            occupiedRanges: components["schemas"]["PlaceOccupiedRange"][];
            placeId: string;
        };
        PlaceForHost: {
            id: string;
            localizedTexts: components["schemas"]["LocalizedText"][];
            name: string;
            rooms: (components["schemas"]["RoomBathroom"] | components["schemas"]["RoomBedroom"] | components["schemas"]["RoomDen"] | components["schemas"]["RoomKitchen"] | components["schemas"]["RoomLivingRoom"])[];
            sleeps: number;
            /** @enum {string} */
            style: "cabin" | "cave" | "cottage" | "dump" | "lean_to" | "tent" | "treehouse";
        };
        PlaceForVisitors: {
            displayStyle: string;
            favorited: boolean;
            favoriteId: string | null;
            id: string;
            rooms: (components["schemas"]["RoomBathroomForVisitors"] | components["schemas"]["RoomBedroomForVisitors"] | components["schemas"]["RoomDenForVisitors"] | components["schemas"]["RoomKitchenForVisitors"] | components["schemas"]["RoomLivingRoomForVisitors"])[];
            sleeps: number;
            /** @enum {string} */
            style: "cabin" | "cave" | "cottage" | "dump" | "lean_to" | "tent" | "treehouse";
            title: string;
        };
        PlaceOccupiedRange: {
            /** Format: date */
            endsOn: string;
            /** Format: date */
            startsOn: string;
        };
        PlaceSummary: {
            id: string;
            name: string;
        };
        PlaceSummaryForVisitors: {
            favorited: boolean;
            favoriteId: string | null;
            id: string;
            title: string;
        };
        Review: {
            body: string;
            bookingId: string;
            /** Format: date-time */
            createdAt: string;
            id: string;
            rating: number;
        };
        ReviewSummary: {
            body: string;
            bookingId: string;
            /** Format: date-time */
            createdAt: string;
            id: string;
            rating: number;
        };
        ReviewVisitorSummary: {
            body: string;
            /** Format: date-time */
            createdAt: string;
            id: string;
            rating: number;
        };
        RoomBathroom: {
            /** @enum {string|null} */
            bathOrShowerStyle: "bath" | "bath_and_shower" | "none" | "shower" | null;
            id: string;
            position: number | null;
            /** @enum {string} */
            type: "Bathroom";
        };
        RoomBathroomForHost: {
            /** @enum {string|null} */
            bathOrShowerStyle: "bath" | "bath_and_shower" | "none" | "shower" | null;
            id: string;
            localizedTexts: components["schemas"]["LocalizedText"][];
            position: number | null;
            /** @enum {string} */
            type: "Bathroom";
        };
        RoomBathroomForVisitors: {
            bathOrShowerStyle: components["schemas"]["BathOrShowerStyle"];
            displayType: string;
            id: string;
            title: string;
            /** @enum {string} */
            type: "Bathroom";
        };
        RoomBathroomSummary: {
            id: string;
            position: number | null;
            /** @enum {string} */
            type: "Bathroom";
        };
        RoomBedroom: {
            bedTypes: ("bunk" | "cot" | "king" | "queen" | "sofabed" | "twin")[];
            id: string;
            position: number | null;
            /** @enum {string} */
            type: "Bedroom";
        };
        RoomBedroomForHost: {
            bedTypes: ("bunk" | "cot" | "king" | "queen" | "sofabed" | "twin")[];
            id: string;
            localizedTexts: components["schemas"]["LocalizedText"][];
            position: number | null;
            /** @enum {string} */
            type: "Bedroom";
        };
        RoomBedroomForVisitors: {
            bedTypes: components["schemas"]["BedType"][];
            displayType: string;
            id: string;
            title: string;
            /** @enum {string} */
            type: "Bedroom";
        };
        RoomBedroomSummary: {
            id: string;
            position: number | null;
            /** @enum {string} */
            type: "Bedroom";
        };
        RoomDen: {
            id: string;
            position: number | null;
            /** @enum {string} */
            type: "Den";
        };
        RoomDenForHost: {
            id: string;
            localizedTexts: components["schemas"]["LocalizedText"][];
            position: number | null;
            /** @enum {string} */
            type: "Den";
        };
        RoomDenForVisitors: {
            displayType: string;
            id: string;
            title: string;
            /** @enum {string} */
            type: "Den";
        };
        RoomDenSummary: {
            id: string;
            position: number | null;
            /** @enum {string} */
            type: "Den";
        };
        RoomKitchen: {
            appliances: ("dishwasher" | "microwave" | "oven" | "stove")[];
            id: string;
            position: number | null;
            /** @enum {string} */
            type: "Kitchen";
        };
        RoomKitchenForHost: {
            appliances: ("dishwasher" | "microwave" | "oven" | "stove")[];
            id: string;
            localizedTexts: components["schemas"]["LocalizedText"][];
            position: number | null;
            /** @enum {string} */
            type: "Kitchen";
        };
        RoomKitchenForVisitors: {
            appliances: components["schemas"]["Appliance"][];
            displayType: string;
            id: string;
            title: string;
            /** @enum {string} */
            type: "Kitchen";
        };
        RoomKitchenSummary: {
            id: string;
            position: number | null;
            /** @enum {string} */
            type: "Kitchen";
        };
        RoomLivingRoom: {
            id: string;
            position: number | null;
            /** @enum {string} */
            type: "LivingRoom";
        };
        RoomLivingRoomForHost: {
            id: string;
            localizedTexts: components["schemas"]["LocalizedText"][];
            position: number | null;
            /** @enum {string} */
            type: "LivingRoom";
        };
        RoomLivingRoomForVisitors: {
            displayType: string;
            id: string;
            title: string;
            /** @enum {string} */
            type: "LivingRoom";
        };
        RoomLivingRoomSummary: {
            id: string;
            position: number | null;
            /** @enum {string} */
            type: "LivingRoom";
        };
        Status: {
            status: string;
        };
        ValidationErrors: {
            /** @enum {string} */
            type: "validation";
            errors: {
                [key: string]: string[];
            };
        };
    };
    responses: {
        /** @description The request has succeeded, but there is no content to render */
        NoContent: {
            headers: {
                [name: string]: unknown;
            };
            content?: never;
        };
        /** @description The server would not process the request due to something the server considered to be a client error */
        BadRequest: {
            headers: {
                [name: string]: unknown;
            };
            content?: never;
        };
        /** @description The request was not successful because it lacks valid authentication credentials for the requested resource */
        Unauthorized: {
            headers: {
                [name: string]: unknown;
            };
            content?: never;
        };
        /** @description Understood the request, but refused to process it */
        Forbidden: {
            headers: {
                [name: string]: unknown;
            };
            content?: never;
        };
        /** @description The specified resource was not found */
        NotFound: {
            headers: {
                [name: string]: unknown;
            };
            content?: never;
        };
        /** @description The request failed because a conflict was detected with the given request params */
        Conflict: {
            headers: {
                [name: string]: unknown;
            };
            content?: never;
        };
        /** @description the server encountered an unexpected condition that prevented it from fulfilling the request */
        InternalServerError: {
            headers: {
                [name: string]: unknown;
            };
            content?: never;
        };
    };
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;
