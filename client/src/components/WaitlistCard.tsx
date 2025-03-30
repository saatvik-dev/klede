import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { emailSchema } from '@shared/schema';
import { useMutation } from '@tanstack/react-query';
import { addToWaitlist } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import KledeLogo from './KledeLogo';
import { z } from 'zod';
import { CheckCircle } from 'lucide-react';

type EmailFormValues = z.infer<typeof emailSchema>;

const WaitlistCard: React.FC = () => {
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors },
  } = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: '',
    }
  });
  
  const mutation = useMutation({
    mutationFn: (data: EmailFormValues) => {
      return addToWaitlist(data.email);
    },
    onSuccess: () => {
      setIsSuccess(true);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to join waitlist. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const onSubmit = (data: EmailFormValues) => {
    mutation.mutate(data);
  };
  
  return (
    <div className="w-full max-w-md">
      <KledeLogo />
      
      {!isSuccess ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-8">
          <div>
            <div className="relative">
              <input 
                type="email" 
                className={`w-full px-4 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all`}
                placeholder="Enter your email"
                {...register('email')}
                disabled={mutation.isPending}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:opacity-70"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <span className="flex justify-center space-x-1">
                <span className="loading-dot w-1.5 h-1.5 bg-white rounded-full"></span>
                <span className="loading-dot w-1.5 h-1.5 bg-white rounded-full"></span>
                <span className="loading-dot w-1.5 h-1.5 bg-white rounded-full"></span>
              </span>
            ) : (
              "Join Waitlist"
            )}
          </button>
        </form>
      ) : (
        <div className="text-center py-4 animate-fade-in mt-8">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          <h2 className="mt-3 text-xl font-medium text-gray-900">You're on the list!</h2>
          <p className="mt-2 text-gray-600">We'll notify you when we launch.</p>
        </div>
      )}
    </div>
  );
};

export default WaitlistCard;
