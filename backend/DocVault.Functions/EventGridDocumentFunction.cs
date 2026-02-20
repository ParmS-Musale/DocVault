using System;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using Azure.Messaging.EventGrid;

namespace DocVault.Functions
{
    public class EventGridDocumentFunction
    {
        private readonly ILogger<EventGridDocumentFunction> _logger;

        public EventGridDocumentFunction(ILogger<EventGridDocumentFunction> logger)
        {
            _logger = logger;
        }

        [Function("EventGridDocumentFunction")]
        public async Task RunAsync(
            [EventGridTrigger] EventGridEvent eventGridEvent)
        {
            _logger.LogInformation("Event Grid trigger fired.");
            _logger.LogInformation("  Subject:    {Subject}", eventGridEvent.Subject);
            _logger.LogInformation("  Event Type: {EventType}", eventGridEvent.EventType);
            _logger.LogInformation("  Data:       {Data}", eventGridEvent.Data?.ToString());

            if (eventGridEvent.EventType == "DocVault.DocumentUploaded")
            {
                var data = JsonSerializer.Deserialize<DocumentUploadedData>(
                    eventGridEvent.Data?.ToString() ?? "{}");

                _logger.LogInformation(
                    "DocumentUploaded → Doc {Id}, User {User}, File {File}",
                    data?.Id, data?.UserId, data?.FileName);

                // TODO: Add notification logic (email, push notification, etc.)
                await Task.CompletedTask;

                _logger.LogInformation("Event Grid processing complete for {Id}.", data?.Id);
            }
        }

        private record DocumentUploadedData(string Id, string FileName, string UserId);
    }
}
