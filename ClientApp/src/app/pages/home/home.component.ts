import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.html',
  styleUrl: './home.css',
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatDividerModule, RouterLink],
})
export class HomeComponent {}
