import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  loading = false;
  error: string | null = null;
  success = false;
  hidePassword = true;
  hideConfirmPassword = true;

  roles = [
    { value: 'logistica', label: 'Personal de Logística' },
    { value: 'residente', label: 'Residente de Obra' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      rol: ['logistica', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Redirigir si ya está autenticado
    this.authService.isAuthenticated$.subscribe(isAuth => {
      if (isAuth) {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.loading = true;
      this.error = null;

      const { email, password, nombre, rol } = this.registerForm.value;

      this.authService.signUp(email, password, nombre, rol).subscribe({
        next: ({ user, error }) => {
          this.loading = false;
          if (error) {
            this.error = this.getErrorMessage(error);
          } else if (user) {
            this.success = true;
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 3000);
          }
        },
        error: (err) => {
          this.loading = false;
          this.error = 'Error de conexión. Intente nuevamente.';
          console.error('Register error:', err);
        }
      });
    }
  }

  private getErrorMessage(error: any): string {
    switch (error.message) {
      case 'User already registered':
        return 'Este email ya está registrado. Intente con otro email.';
      case 'Password should be at least 6 characters':
        return 'La contraseña debe tener al menos 6 caracteres.';
      case 'Invalid email':
        return 'Email inválido. Verifique el formato.';
      case 'Signup is disabled':
        return 'El registro está deshabilitado temporalmente.';
      default:
        return 'Error al registrar usuario. Intente nuevamente.';
    }
  }

  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        const fieldLabels: { [key: string]: string } = {
          nombre: 'Nombre',
          email: 'Email',
          password: 'Contraseña',
          confirmPassword: 'Confirmación de contraseña',
          rol: 'Rol'
        };
        return `${fieldLabels[fieldName]} es requerido`;
      }
      if (field.errors['email']) {
        return 'Email inválido';
      }
      if (field.errors['minlength']) {
        if (fieldName === 'password') {
          return 'La contraseña debe tener al menos 6 caracteres';
        }
        if (fieldName === 'nombre') {
          return 'El nombre debe tener al menos 2 caracteres';
        }
      }
      if (field.errors['passwordMismatch']) {
        return 'Las contraseñas no coinciden';
      }
    }
    return '';
  }
}