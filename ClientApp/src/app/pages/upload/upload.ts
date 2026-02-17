import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-upload',
  standalone: true,
  templateUrl: './upload.html',
  styleUrls: ['./upload.css'],
  imports: [MatCardModule, MatButtonModule],
})
export class UploadComponent {
  selectedFile: File | null = null;

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  uploadFile() {
    if (this.selectedFile) {
      console.log('Uploading:', this.selectedFile.name);
      alert('File uploaded (demo)');
    } else {
      alert('Please select a file');
    }
  }
}
