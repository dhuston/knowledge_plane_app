# Map Router Migration Documentation

## Overview

This document describes the migration from the old map router implementation in `/app/api/routers/map.py` to the newer, more advanced implementation in `/app/api/v1/endpoints/map.py`. The migration was completed in June 2025.

## Why the Migration was Necessary

The original map router was a basic implementation that lacked important features:
1. Spatial querying capabilities
2. Pagination support
3. Level-of-detail (LOD) rendering
4. Proper tenant isolation
5. Advanced filtering options
6. Graph clustering

The v1 router implementation solved these issues and added significant performance improvements for large datasets.

## Migration Steps Completed

1. Enhanced the v1 router with a node endpoint implementation (`GET /node/{node_type}/{node_id}`)
2. Updated `main.py` to use only the v1 router and remove references to the old router
3. Added permanent redirects for backward compatibility using multiple techniques:
   - Direct route handlers for common paths (`/map/data`, `/map/node/{node_type}/{node_id}`)
   - Dynamic registration of redirect routes during app startup
   - 301 permanent redirects to indicate the API change to clients

4. Removed the old router file completely once all functionality was migrated

## How Backward Compatibility is Maintained

The migration ensures that existing API clients continue to work through several mechanisms:

1. **Direct Route Handlers**: Explicit route handlers were added to `main.py` for the most commonly used paths:
   ```python
   @app.get("/map/data")
   async def direct_map_data(request: Request):
       """Direct fallback map data endpoint."""
       # Redirect to the correct endpoint
       url = f"{request.url.scheme}://{request.url.netloc}/api/v1/map/data{...}"
       return RedirectResponse(url=url)
   ```

2. **Dynamic Registration**: Route handlers are dynamically registered during app startup for various deprecated paths:
   ```python
   deprecated_api_routes = [
       ("/api/map/data", "/api/v1/map/data"),
       ("/api/map/node/{node_type}/{node_id}", "/api/v1/map/node/{node_type}/{node_id}")
   ]
   ```

3. **Permanent Redirects**: All redirects use HTTP 301 status codes, which tell clients to update their bookmarks.

## Testing

The implementation was tested manually by:
1. Verifying syntax correctness in the updated main.py file
2. Checking route registration during application startup
3. Confirming successful request handling for both old and new endpoint paths

## Future Considerations

1. Remove direct route handlers after a deprecation period of 6 months
2. Update client applications to use the v1 endpoints directly
3. Add a deprecation warning header to redirected responses
4. Monitor logs for any remaining calls to deprecated endpoints

## Diff File

A complete diff showing all changes made is available at `map_router_migration.diff` in the same directory as this document.