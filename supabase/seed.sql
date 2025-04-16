-- Sample data for a company knowledge base
-- This seed file contains example data that you can replace with your own content

-- Documents
INSERT INTO public.document (title)
VALUES
('Employee Handbook'),
('Company Policies'),
('Product Documentation'),
('Engineering Guidelines'),
('Marketing Strategy'),
('FAQ');

-- Content blocks
-- Employee Handbook
INSERT INTO public.block (document_id, content)
VALUES
(1, 'Our company was founded in 2010 with a mission to create innovative solutions for businesses.'),
(1, 'We currently have offices in San Francisco, New York, London, and Singapore.'),
(1, 'The company operates on a hybrid work model, allowing employees to work remotely 3 days per week.'),
(1, 'All employees receive 20 days of paid time off per year, plus 10 public holidays.'),
(1, 'Performance reviews are conducted quarterly with formal evaluations happening twice yearly.');

-- Company Policies
INSERT INTO public.block (document_id, content)
VALUES
(2, 'Expense reports must be submitted within 30 days of incurring the expense.'),
(2, 'The dress code is business casual for in-office days and client meetings.'),
(2, 'The company observes every Friday and most Wednesdays as company holidays.'),
(2, 'Employees must complete mandatory security training every 6 months.'),
(2, 'Remote work equipment including a laptop, monitor, and ergonomic chair will be provided.');

-- Product Documentation
INSERT INTO public.block (document_id, content)
VALUES
(3, 'Our flagship product ProcessFlow was launched in 2015 and is currently on version 4.2.'),
(3, 'The DataSync feature allows real-time synchronization between multiple databases.'),
(3, 'Enterprise customers receive 24/7 technical support through our dedicated support team.'),
(3, 'The API documentation is available at api.company.com and includes interactive examples.'),
(3, 'ProcessFlow is compatible with all major cloud providers including AWS, Azure, and GCP.');

-- Engineering Guidelines
INSERT INTO public.block (document_id, content)
VALUES
(4, 'All code must go through code review by at least two team members before merging.'),
(4, 'We follow a microservices architecture with containerized deployments using Kubernetes.'),
(4, 'Continuous Integration tests must pass before any code can be merged to the main branch.'),
(4, 'Documentation should be updated alongside code changes in the same pull request.'),
(4, 'Our infrastructure is managed through Infrastructure as Code using Terraform.');

-- Marketing Strategy
INSERT INTO public.block (document_id, content)
VALUES
(5, 'Our target market includes mid-size to enterprise businesses in the finance and healthcare sectors.'),
(5, 'We prioritize content marketing through our blog, which publishes new articles every Tuesday.'),
(5, 'Customer case studies are our most effective lead generation tool based on conversion metrics.'),
(5, 'We attend three major industry conferences annually: TechCon, DataSummit, and CloudExpo.'),
(5, 'Social media campaigns are coordinated across LinkedIn, Twitter, and our YouTube channel.');

-- FAQ
INSERT INTO public.block (document_id, content)
VALUES
(6, 'Q: What are the company core values? A: Innovation, Integrity, Collaboration, and Customer Success.'),
(6, 'Q: How do I request time off? A: Submit your request through the HR portal at least 2 weeks in advance.'),
(6, 'Q: When is the annual company retreat? A: It typically takes place during the first week of October.'),
(6, 'Q: How can I access the company VPN? A: Install the VPN client from the IT portal and use your SSO credentials.'),
(6, 'Q: What benefits do we offer? A: Health insurance, 401k matching, professional development budget, and wellness programs.');
