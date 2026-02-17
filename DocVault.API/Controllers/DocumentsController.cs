using Microsoft.AspNetCore.Mvc;

namespace DocVault.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DocumentsController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetDocuments()
        {
            return Ok(new { message = "Documents endpoint working" });
        }

        [HttpGet("health")]
        public IActionResult Health()
        {
            return Ok(new { status = "API Healthy" });
        }

        [HttpPost("upload")]
        public async Task<IActionResult> UploadDocument(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "No file selected" });
            }

            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "Uploads");

            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            var filePath = Path.Combine(uploadsFolder, file.FileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return Ok(new
            {
                message = "File uploaded successfully",
                fileName = file.FileName
            });
        }
    }
}
