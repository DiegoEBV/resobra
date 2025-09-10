import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  error: string | null = null;
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // Redirigir si ya está autenticado
    this.authService.isAuthenticated$.subscribe(isAuth => {
      if (isAuth) {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      this.error = null;

      const { email, password } = this.loginForm.value;

      this.authService.signIn(email, password).subscribe({
        next: ({ user, error }) => {
          this.loading = false;
          if (error) {
            this.error = this.getErrorMessage(error);
          } else if (user) {
            this.router.navigate(['/dashboard']);
          }
        },
        error: (err) => {
          this.loading = false;
          this.error = 'Error de conexión. Intente nuevamente.';
          console.error('Login error:', err);
        }
      });
    }
  }

  private getErrorMessage(error: any): string {
    switch (error.message) {
      case 'Invalid login credentials':
        return 'Credenciales inválidas. Verifique su email y contraseña.';
      case 'Email not confirmed':
        return 'Por favor confirme su email antes de iniciar sesión.';
      case 'Too many requests':
        return 'Demasiados intentos. Intente nuevamente más tarde.';
      default:
        return 'Error al iniciar sesión. Intente nuevamente.';
    }
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${fieldName === 'email' ? 'Email' : 'Contraseña'} es requerido`;
      }
      if (field.errors['email']) {
        return 'Email inválido';
      }
      if (field.errors['minlength']) {
        return 'La contraseña debe tener al menos 6 caracteres';
      }
    }
    return '';
  }
}