using System;
using System.Threading.Tasks;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;

namespace DocVault.Functions
{
    public class DocumentProcessingFunction
    {
        private readonly ILogger<DocumentProcessingFunction> _logger;

        public DocumentProcessingFunction(ILogger<DocumentProcessingFunction> logger)
        {
            _logger = logger;
        }

        [Function("DocumentProcessingFunction")]
        public async Task RunAsync(
            [ServiceBusTrigger("document-processing", Connection = "ServiceBusConnection")] string myQueueItem)
        {
            _logger.LogInformation($"C# ServiceBus queue trigger function processed message: {myQueueItem}");

            // Simulate heavy processing
            await Task.Delay(1000); 

            _logger.LogInformation("Heavy processing completed.");
        }
    }
}
