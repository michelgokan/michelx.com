/* Every project, lifetime-complete. cat: research | industry | early */
window.PROJECTS = [
  {
    name: "Softwarify®",
    img: "assets/img/softwarify.jpg",
    years: "Since 2025",
    cat: "industry",
    role: "Co-Founder · Chairman · CEO/CTPO",
    desc: "A human-AI collaboration platform for software teams, where both human and AI engineers build large-scale software together. Research-led, currently in stealth.",
    tags: ["Agentic AI", "LLMs", "Microservices", "Startup"],
    links: [{ t: "softwarify.ai", u: "https://softwarify.ai" }]
  },
  {
    name: "VETTE × Condé Nast",
    img: "assets/img/vette.jpg?v=2",
    years: "Since 2025",
    cat: "industry",
    role: "CTO @ Co-Cart AB",
    desc: "Leading the technology behind Condé Nast's VETTE: an AI-powered creator-commerce marketplace launching 2026, where creators design and own their digital storefronts with a new revenue-share model.",
    tags: ["Condé Nast", "Creator Commerce", "AI", "Marketplaces"],
    links: [{ t: "Announcement coverage", u: "https://fashionunited.com/news/retail/conde-nast-bets-on-creator-commerce-with-vette/2025091768263" }]
  },
  {
    name: "PerfCam",
    img: "assets/img/perfcam.jpg",
    years: "2024 - 2025",
    cat: "research",
    role: "Author · Postdoc @ KTH × AstraZeneca",
    desc: "Digital twinning for production lines using 3D Gaussian Splatting and vision models: semi-automated industrial digital twins with real-time production diagnostics, deployed with AstraZeneca. Published in IEEE Access.",
    tags: ["3D Gaussian Splatting", "Computer Vision", "Digital Twin", "Industry 5.0"],
    links: [
      { t: "Paper", u: "https://ieeexplore.ieee.org/document/10990187" },
      { t: "Code", u: "https://github.com/AstraZeneca/PerfCam" },
      { t: "Dataset", u: "https://github.com/AstraZeneca/PerfCam-Dataset" },
      { t: "Video", u: "https://ieeexplore.ieee.org/ielx8/6287639/10820123/10990187/graphical_abstract/access-gavideo-3567702.mp4" }
    ]
  },
  {
    name: "SMART Predictive Maintenance",
    img: "assets/img/smart.jpg",
    years: "2024 - 2025",
    cat: "research",
    role: "Industrial Postdoctoral Fellow",
    desc: "Smart Predictive Maintenance for the Pharmaceutical Industry: a Digital Futures ISPP project with AstraZeneca, KTH, and Linköping University: edge digital twinning, computer vision, and ML-driven optimization for pharma production.",
    tags: ["Predictive Maintenance", "Pharma", "Edge AI", "ML Optimization"],
    links: [{ t: "Project", u: "https://www.digitalfutures.kth.se/project/smart-smart-predictive-maintenance-for-the-pharmaceutical-industry/" }]
  },
  {
    name: "PerfSim",
    img: "assets/img/perfsim.jpg",
    years: "2019 - 2023",
    cat: "research",
    role: "Author · PhD Research",
    desc: "A discrete-event simulator and digital-twinning platform for cloud-native service chains that predicts the performance of microservice topologies before deployment. Published in IEEE Transactions on Cloud Computing.",
    tags: ["Simulation", "Cloud Native", "Kubernetes", "Python"],
    links: [
      { t: "Homepage", u: "https://www.perfsim.com" },
      { t: "Paper", u: "https://ieeexplore.ieee.org/document/9652084" },
      { t: "Code", u: "https://github.com/michelgokan/perfsim" },
      { t: "Dataset", u: "https://ieee-dataport.org/documents/experiments-data-used-evaluating-perfsim-simulation-accuracy-based-sfc-stress-workloads" }
    ]
  },
  {
    name: "Spotin Platform",
    img: "assets/img/spotin.jpg",
    years: "2022 - 2024",
    cat: "industry",
    role: "CTO",
    award: "Technology acquired by Condé Nast",
    desc: "Re-architected Spotin's entire content-commerce product into a scalable, robust microservice architecture with modern DevOps - leading all technology until the platform's acquisition by Condé Nast.",
    tags: ["E-commerce", "Microservices", "DevOps", "Acquired"],
    links: [{ t: "spotin.com", u: "https://www.spotin.com" }]
  },
  {
    name: "GAT + Deep Q-Learning Mesh Optimizer",
    img: "assets/img/gat.jpg",
    years: "2023 - 2024",
    cat: "research",
    role: "First Author",
    desc: "Graph Attention Networks combined with Deep Q-Learning for service-mesh optimization through a digital-twinning approach. Published at IEEE ICC 2024.",
    tags: ["GNN", "Reinforcement Learning", "Service Mesh", "Digital Twin"],
    links: [{ t: "Paper", u: "https://ieeexplore.ieee.org/document/10622616" }]
  },
  {
    name: "EasyEPC",
    img: "assets/img/easyepc.jpg",
    years: "2018 - 2020",
    cat: "research",
    role: "Fellowship/Intern @ Ericsson",
    award: "Patented: US · EPO · WIPO",
    desc: "NFV optimization and capacity planning for virtualized EPC and 5G Core at Ericsson: profiling, simulation, and performance-modeling strategies that became the patent “Performance Modeling for Cloud Applications” (US 11,962,474). Details under NDA.",
    tags: ["5G Core", "NFV", "Performance Modeling", "Patent"],
    links: [{ t: "Patent", u: "https://patents.google.com/patent/US11962474B2/en" }]
  },
  {
    name: "sfc-stress",
    img: "assets/img/sfcstress.jpg",
    years: "2020",
    cat: "research",
    role: "Author · Open Source",
    desc: "A Docker-based, Kubernetes-ready synthetic service mesh generating CPU-, memory-, disk-, and network-intensive workloads with chainable services: the workload engine behind PerfSim's validation.",
    tags: ["Kubernetes", "Benchmarking", "Docker", "Open Source"],
    links: [{ t: "Code", u: "https://github.com/michelgokan/sfc-stress" }]
  },
  {
    name: "NFV-Inspector",
    img: "assets/img/nfvinspector.jpg",
    years: "2017 - 2018",
    cat: "research",
    role: "Author · PhD Research",
    award: "IEEE Best Demo - NFV-SDN '18",
    desc: "A systematic platform to profile and analyze Virtual Network Functions, with a plugin ecosystem (Kubernetes, OpenStack, InfluxDB, BMS-HSS-FE). Published at IEEE CloudNet 2018.",
    tags: ["NFV", "Profiling", "5G", "Open Source"],
    links: [
      { t: "Paper", u: "https://ieeexplore.ieee.org/document/8549333" },
      { t: "Code", u: "https://github.com/michelgokan/NFV-Inspector" }
    ]
  },
  {
    name: "MACoMEC",
    img: "assets/img/macomec.jpg",
    years: "2018 - 2019",
    cat: "research",
    role: "Research Collaborator",
    desc: "Collaborative Mobility-Aware Computation Offloading for Mobile Edge Computing: a joint China-Sweden STINT project with a research visit at Zhejiang University.",
    tags: ["Edge Computing", "MEC", "Offloading"],
    links: []
  },
  {
    name: "Edge Computing - IET Book",
    img: "assets/img/edgebook.jpg",
    years: "2018 - 2020",
    cat: "research",
    role: "Co-Author (4 chapters)",
    desc: "Co-authored four chapters of “Edge Computing: Models, Technologies and Applications” (IET, 2020): introduction, resource-allocation models, networking models & protocols, and open-source edge projects.",
    tags: ["Edge Computing", "Book Chapters", "Architecture"],
    links: [{ t: "Book", u: "https://digital-library.theiet.org/doi/book/10.1049/pbpc033e" }]
  },
  {
    name: "SocioBalance",
    img: "assets/img/sociobalance.jpg?v=2",
    years: "2025",
    cat: "research",
    role: "Co-Author",
    desc: "A network-based simulation game that ranks links' impact strength in complex social systems; journal article under review.",
    tags: ["Network Science", "Simulation", "Games"],
    links: []
  },
  {
    name: "Kani",
    img: "assets/img/kani.jpg",
    years: "2014 - 2016",
    cat: "research",
    role: "Co-Author",
    desc: "A QoS-aware hypervisor-level scheduler for cloud computing environments. Published in Cluster Computing (Springer, 2016).",
    tags: ["Hypervisor", "Scheduling", "QoS", "Xen"],
    links: [{ t: "Paper", u: "https://link.springer.com/article/10.1007/s10586-016-0541-5" }]
  },
  {
    name: "SLA-Aware Xen CPU Scheduler",
    img: "assets/img/slaxen.jpg",
    years: "2013 - 2015",
    cat: "research",
    role: "MSc Thesis",
    desc: "An SLA-aware virtual-machine CPU scheduling algorithm for the Xen hypervisor, improving efficiency in virtualized cloud environments. MSc thesis at Iran University of Science and Technology.",
    tags: ["Xen", "Cloud", "Scheduling", "SLA"],
    links: [{ t: "Thesis", u: "https://www.researchgate.net/publication/344217890_SLA-Aware_Virtual_Machines_CPU_Scheduling_in_Cloud_Environments" }]
  },
  {
    name: "collectd-top",
    img: "assets/img/collectdtop.jpg",
    years: "2016 - 2025",
    cat: "research",
    role: "Author · Open Source",
    desc: "A collectd plugin that measures and reports the top processes by CPU or memory: a small monitoring utility kept alive for nearly a decade.",
    tags: ["Monitoring", "Perl", "Open Source"],
    links: [{ t: "Code", u: "https://github.com/michelgokan/collectd-top" }]
  },
  {
    name: "kube-openmon",
    img: "assets/img/kubeopenmon.jpg",
    years: "2018",
    cat: "research",
    role: "Author · Open Source",
    desc: "A lightweight daemon that pushes Kubernetes cAdvisor metrics directly to InfluxDB, Elasticsearch, Logstash, and more.",
    tags: ["Kubernetes", "Observability", "Metrics"],
    links: [{ t: "Code", u: "https://github.com/michelgokan/kube-openmon" }]
  },
  {
    name: "openstack-collectd",
    img: "assets/img/openstackcollectd.jpg",
    years: "2018",
    cat: "research",
    role: "Author · Open Source",
    desc: "A collectd plugin reporting OpenStack-related statistics for cloud-infrastructure monitoring.",
    tags: ["OpenStack", "Monitoring", "Open Source"],
    links: [{ t: "Code", u: "https://github.com/michelgokan/openstack-collectd" }]
  },
  {
    name: "Qlerify (Advisory)",
    img: "assets/img/qlerify.jpg",
    years: "Since 2024",
    cat: "industry",
    role: "Advisory Board Member",
    desc: "Advisory board member at Qlerify AB, Stockholm: an AI-powered collaborative process- and data-modeling tool for software teams.",
    tags: ["Advisory", "AI", "Process Modeling"],
    links: [{ t: "qlerify.com", u: "https://www.qlerify.com" }]
  },
  {
    name: "B2B2C Platform @ RM Innovation",
    img: "assets/img/rm.jpg?v=2",
    years: "2016 - 2017",
    cat: "industry",
    role: "Tech Lead · Solution Architect",
    desc: "Designed B2B2C solutions and led the organization's transition to agile methodologies for a Kentucky-based company, working as tech lead and solution architect.",
    tags: ["Architecture", "B2B2C", "Agile"],
    links: []
  },
  {
    name: "Olam Technologies Group",
    img: "assets/img/olam.jpg?v=2",
    years: "2011 - 2015",
    cat: "industry",
    role: "Co-Founder · CEO",
    desc: "Founded and ran a software house serving customers worldwide: home-automation systems, a SaaS/PaaS platform for online project assessment, a complete online-shopping solution, and many bespoke products.",
    tags: ["Founder", "SaaS/PaaS", "Home Automation", "E-commerce"],
    links: []
  },
  {
    name: "Vaimo AB",
    img: "assets/img/vaimo.jpg?v=2",
    years: "2013 - 2014",
    cat: "industry",
    role: "Senior Full-Stack Developer",
    desc: "As a remote senior BE/FE developer at Vaimo, one of Europe's leading Magento agencies, I contributed development, modules, and bug fixes across many client projects together with a 125-person team: Eton Shirts, Björn Borg (Loop54 search), TopStreetWear, Flight Club (ERP alerts), Ridestore (payments), Kaibosh, Belysningsdesign, Hardox (full frontend), and vaimo.com itself, plus SLA on-call support for Gant, Konga, and Pavers.",
    tags: ["Magento", "E-commerce", "PHP"],
    links: []
  },
  {
    name: "Nutriga Technologies",
    img: "assets/img/nutriga.jpg?v=2",
    years: "2009 - 2011",
    cat: "industry",
    role: "Project Manager",
    desc: "Managed and delivered diverse online solutions across industries at Nutriga Technologies.",
    tags: ["Full-Stack", "Web"],
    links: []
  },
  {
    name: "Fixed-Asset Management System",
    img: "assets/img/fixedasset.jpg?v=2",
    years: "2008 - 2009",
    cat: "industry",
    role: "Software Developer",
    desc: "A Windows-based fixed-asset management application built at Setareh Sepehr Afzar: the first shipped product of the career.",
    tags: ["Windows", "Desktop", ".NET"],
    links: []
  },
  {
    name: "Mobile Game - Swedish Game Awards",
    img: "assets/img/mobilegame.jpg?v=2",
    years: "2019",
    cat: "early",
    role: "Developer",
    award: "Nominee, Best Mobile Execution, SGA 2019",
    desc: "A mobile game project nominated for Best Mobile Execution at the Swedish Game Awards 2019, Sweden's largest game-dev competition.",
    tags: ["Game Dev", "Mobile"],
    links: [{ t: "SGA 2019", u: "https://www.gameawards.se/Games/2019" }]
  },
  {
    name: "Deep RL Explorations",
    img: "assets/img/deeprl.jpg",
    years: "2019 - 2023",
    cat: "early",
    role: "Independent Study",
    desc: "Hands-on reinforcement-learning experiments: PyTorch CartPole agents, routing traveling salesmen on random graphs with RL, graph-attention DRL, and AlphaZero-style solvers.",
    tags: ["PyTorch", "RL", "GNN"],
    links: [{ t: "CartPole", u: "https://github.com/michelgokan/simple-pytorch-cartpole" }]
  },
  {
    name: "Earthworm Crawler Robot",
    years: "2009 - 2010",
    cat: "early",
    role: "Builder · Researcher",
    img: "assets/img/crawler.jpg",
    desc: "An extremely low-cost bio-inspired crawler robot that inches forward like an earthworm, its gait evolved with a NEAT-based genetic algorithm.",
    tags: ["Neuroevolution", "NEAT", "Robotics"],
    links: []
  },
  {
    name: "Autonomous Quadrotor",
    years: "2009 - 2013",
    cat: "early",
    role: "Builder · Researcher",
    img: "assets/img/quadrotor.jpg",
    desc: "Designed and built an unmanned quadrotor from scratch (Xmega + ArduIMU + an Android phone) and taught it to fly: adaptive PID tuning for stability, then NEAT neuroevolution wired in over serial.",
    tags: ["Drones", "NEAT", "PID", "Hardware"],
    links: []
  },
  {
    name: "RoboCup Coaching & Robotics Division",
    img: "assets/img/coaching.jpg",
    years: "2009 - 2014",
    cat: "early",
    role: "Coach · Division Leader",
    desc: "Coached multiple high-school RoboCup 2D soccer-simulation teams in advanced C/C++ (2009-2012) and led the Robotics Division of the Armenian Association of University Graduates in Iran (2010-2014).",
    tags: ["C/C++", "Teaching", "Robotics"],
    links: []
  },
  {
    name: "ArmRobotics LineFollower",
    years: "2008",
    cat: "early",
    role: "Builder",
    img: "assets/img/linefollower.jpg",
    desc: "Designed and raced an advanced line-follower robot in the ArmRobotics competition: hardware, PCB, and control code.",
    tags: ["Hardware", "PCB", "Embedded"],
    links: []
  },
  {
    name: "RoboCup 2D Soccer Simulation Team",
    years: "2005 - 2008",
    cat: "early",
    role: "Team Lead",
    award: "German World Cup 2006 qualifier · 5th IranOpen · League Champion",
    img: "assets/img/robocup.jpg",
    desc: "Led development of an autonomous RoboCup 2D soccer-simulation team: multi-agent AI in C++, reaching the German World Cup 2006 qualification (13th), 5th at IranOpen 2006, and champions of the National Open League.",
    tags: ["Multi-Agent AI", "C++", "RoboCup"],
    links: []
  },
  {
    name: "Wireless Game-Show Buzzer System",
    img: "assets/img/buzzer.jpg",
    years: "Archive",
    cat: "early",
    role: "Hardware Builder",
    desc: "A wireless lockout buzzer system for live game shows, determining in real time which contestant pressed first: RF hardware, timing logic, and a host console.",
    tags: ["Hardware", "RF", "Real-Time"],
    links: []
  },
  {
    name: "JeUBeautySplash.com",
    img: "assets/img/jeu.jpg",
    years: "Archive",
    cat: "industry",
    role: "Freelance Developer",
    desc: "An online jewelry shop built end to end, together with a responsive, customizable product-filter slider widget for Magento. The brand has since relaunched on a new site by others; the shop I built lives on in the archive.",
    tags: ["Magento", "E-commerce", "Widgets"],
    links: [{ t: "Archived site (2015)", u: "https://web.archive.org/web/20150526203238/http://jeubeautysplash.com/" }]
  }
];
