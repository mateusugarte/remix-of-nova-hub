
-- Migrate old string statuses to UUID column IDs
UPDATE prospects SET status = 'a3a92423-0494-4ad6-979b-8de6d8e993a3' WHERE status = 'entrar_contato';
UPDATE prospects SET status = '96a024d3-304c-411d-a8f8-f1ac7a6687e6' WHERE status = 'mensagem_enviada';
UPDATE prospects SET status = '96668137-5803-4588-927a-1b2709212a3b' WHERE status = 'respondeu';
UPDATE prospects SET status = 'def65ee8-59d0-41ac-8a4e-5e1ed11f3ead' WHERE status = 'rejeitou';
UPDATE prospects SET status = 'f6357228-7dcd-4d54-90b8-52ff5ba6344b' WHERE status = 'agendou';
