import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent implements OnInit {

  recolhida = false;
  nomeUsuario = '';
  inicialUsuario = '';
  perfilUsuario = '';
  isAdmin = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const payload = this.authService.getPayload();
    if (payload) {
      const email = payload.sub ?? '';
      this.nomeUsuario = email.split('@')[0];
      this.inicialUsuario = this.nomeUsuario.charAt(0).toUpperCase();
      this.perfilUsuario = payload.groups?.[0] ?? '';
      this.isAdmin = this.authService.isAdmin();
    }
  }

  toggleSidebar(): void {
    this.recolhida = !this.recolhida;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}