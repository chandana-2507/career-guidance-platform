import 'dotenv/config';
import mongoose from 'mongoose';
import Career from '../models/Career.js';
import Internship from '../models/Internship.js';
import Project from '../models/Project.js';
import Skill from '../models/Skill.js';
import User from '../models/User.js';

const careers = [
  {
    career_name: 'Web Developer',
    required_skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'Git'],
    average_salary: 75000,
    industry_demand: 'high',
    description: 'Build and maintain websites and web applications.',
    roadmap_steps: ['HTML & CSS', 'JavaScript', 'React', 'Backend (Node.js)', 'Databases', 'Projects', 'Deployment'],
    difficulty: 'intermediate',
    growth_potential: 'high',
  },
  {
    career_name: 'Data Scientist',
    required_skills: ['Python', 'Statistics', 'Machine Learning', 'SQL', 'Data Visualization'],
    average_salary: 95000,
    industry_demand: 'very_high',
    description: 'Analyze data and build predictive models.',
    roadmap_steps: ['Python', 'Statistics', 'SQL', 'Machine Learning', 'Deep Learning', 'Projects'],
    difficulty: 'advanced',
    growth_potential: 'high',
  },
  {
    career_name: 'Software Engineer',
    required_skills: ['Programming', 'Data Structures', 'Algorithms', 'System Design', 'Git'],
    average_salary: 90000,
    industry_demand: 'very_high',
    description: 'Design and develop software systems.',
    roadmap_steps: ['Programming fundamentals', 'DSA', 'OOP', 'Databases', 'System Design', 'Projects'],
    difficulty: 'intermediate',
    growth_potential: 'high',
  },
  {
    career_name: 'UX Designer',
    required_skills: ['User Research', 'Wireframing', 'Prototyping', 'Figma', 'UI Design'],
    average_salary: 72000,
    industry_demand: 'high',
    description: 'Design user-centered digital experiences.',
    roadmap_steps: ['Design fundamentals', 'User Research', 'Wireframing', 'Prototyping', 'Figma', 'Portfolio'],
    difficulty: 'intermediate',
    growth_potential: 'high',
  },
  {
    career_name: 'Cyber Security Analyst',
    required_skills: ['Networking', 'Linux', 'Security Fundamentals', 'Cryptography', 'Ethical Hacking'],
    average_salary: 85000,
    industry_demand: 'high',
    description: 'Protect systems and data from threats.',
    roadmap_steps: ['Networking', 'Linux', 'Security basics', 'Cryptography', 'Penetration testing', 'Certifications'],
    difficulty: 'advanced',
    growth_potential: 'high',
  },
];

const jobs = [
  { company: 'Tech Corp', role: 'Frontend Intern', skills_required: ['React', 'JavaScript'], location: 'Remote', apply_link: 'https://example.com/apply', career: 'Web Developer', careerSlug: 'web-developer' },
  { company: 'Data Inc', role: 'Data Science Intern', skills_required: ['Python', 'ML'], location: 'NYC', apply_link: 'https://example.com/apply', career: 'Data Scientist', careerSlug: 'data-scientist' },
  { company: 'Secure Ltd', role: 'Security Intern', skills_required: ['Networking', 'Linux'], location: 'Remote', career: 'Cyber Security Analyst', careerSlug: 'cyber-security-analyst' },
];

const projects = [
  { title: 'Password Strength Checker', description: 'Build a tool to validate password strength', career: 'Cyber Security Analyst', careerSlug: 'cyber-security-analyst', skills_gained: ['Python', 'Security'], difficulty: 'beginner', github_example: 'https://github.com' },
  { title: 'Vulnerability Scanner', description: 'Simple port and vulnerability scanner', career: 'Cyber Security Analyst', careerSlug: 'cyber-security-analyst', skills_gained: ['Python', 'Networking'], difficulty: 'intermediate', github_example: 'https://github.com' },
  { title: 'Todo App with React', description: 'Full-stack todo application', career: 'Web Developer', careerSlug: 'web-developer', skills_gained: ['React', 'Node.js'], difficulty: 'beginner', github_example: 'https://github.com' },
  { title: 'Data Dashboard', description: 'Visualize dataset with charts', career: 'Data Scientist', careerSlug: 'data-scientist', skills_gained: ['Python', 'Visualization'], difficulty: 'intermediate', github_example: 'https://github.com' },
];

const skills = [
  { name: 'JavaScript', category: 'technical' },
  { name: 'React', category: 'technical' },
  { name: 'Python', category: 'technical' },
  { name: 'Node.js', category: 'technical' },
  { name: 'HTML', category: 'technical' },
  { name: 'CSS', category: 'technical' },
  { name: 'Machine Learning', category: 'technical' },
  { name: 'SQL', category: 'technical' },
  { name: 'Communication', category: 'soft' },
  { name: 'Problem Solving', category: 'soft' },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/career-guidance');
  await Career.deleteMany({});
  await Internship.deleteMany({});
  await Project.deleteMany({});
  await Skill.deleteMany({});
  await Career.insertMany(careers);
  await Internship.insertMany(jobs);
  await Project.insertMany(projects);
  await Skill.insertMany(skills);
  console.log('Seed completed.');
  const adminUser = await User.findOne({ email: 'admin@example.com' });
  if (!adminUser) {
    await User.create({
      name: 'Admin',
      email: 'admin@example.com',
      password: 'Admin@123',
      role: 'admin',
    });
    console.log('Admin user created: admin@example.com / Admin@123');
  }
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
