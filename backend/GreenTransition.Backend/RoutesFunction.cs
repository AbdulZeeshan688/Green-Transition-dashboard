using System.Net;
using System.Text.Json;
using GreenTransition.Backend.Inputs;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;

namespace GreenTransition.Backend;

public class RoutesFunction(ILogger<RoutesFunction> logger)
{
    [Function("routes")]
    public async Task<HttpResponseData> PostRoutes(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "routes")] HttpRequestData req)
    {
        RouteRequest? request;
        try
        {
            request = await JsonSerializer.DeserializeAsync<RouteRequest>(req.Body, Json.Options);
        }
        catch (JsonException)
        {
            return req.CreateResponse(HttpStatusCode.BadRequest);
        }

        var result = await Pipeline.PlanRoutes(request?.Start, request?.End, Config.LoadOrsApiKey(), logger);
        var response = req.CreateResponse();
        await response.WriteAsJsonAsync(result);
        return response;
    }
}
