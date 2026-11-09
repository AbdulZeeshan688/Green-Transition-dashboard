using Azure.Core.Serialization;
using GreenTransition.Backend;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var builder = FunctionsApplication.CreateBuilder(args);
builder.Services.Configure<WorkerOptions>(options => options.Serializer = new JsonObjectSerializer(Json.Options));
builder.Build().Run();
